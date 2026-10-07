import json
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import DEFAULT_MODEL, FREE_MODELS, validate_and_resolve_model
from app.core.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import ChatRequest, GuestChatRequest
from app.services.openrouter import openrouter_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

# In-memory sliding window rate limiter for unauthenticated guest requests:
# Limit: 20 requests per 60 seconds per IP
GUEST_RATE_LIMIT = 20
GUEST_WINDOW_SECONDS = 60
_guest_request_timestamps: Dict[str, List[float]] = defaultdict(list)


def check_guest_rate_limit(request: Request) -> str:
    """
    Enforces in-memory IP sliding-window rate limit for guest chat.
    Does not touch PostgreSQL or require persistent storage.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif request.client and request.client.host:
        client_ip = request.client.host
    else:
        client_ip = "unknown"

    now = time.time()
    cutoff = now - GUEST_WINDOW_SECONDS
    timestamps = [t for t in _guest_request_timestamps[client_ip] if t > cutoff]

    if len(timestamps) >= GUEST_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Guest rate limit exceeded (20 messages/minute). Please sign in for unlimited messages."
        )

    timestamps.append(now)
    _guest_request_timestamps[client_ip] = timestamps
    return client_ip


@router.get("/models")
async def get_models():
    """
    Returns verified free OpenRouter models available for chat completions.
    """
    return {
        "models": FREE_MODELS,
        "default": DEFAULT_MODEL,
    }


@router.post("/guest")
async def send_guest_chat_message(
    payload: GuestChatRequest,
    request: Request,
):
    """
    Temporary, unauthenticated guest chat endpoint.
    - Rate limited in-memory per IP (20 msgs/min).
    - Ephemeral SSE streaming.
    - Zero persistence in PostgreSQL (does not create users, conversations, or messages).
    """
    check_guest_rate_limit(request)

    clean_message = payload.message.strip()
    if not clean_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )

    try:
        resolved_model = validate_and_resolve_model(payload.model)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )

    # Build ephemeral context from optional guest history (up to last 10 messages)
    formatted_context: List[Dict[str, str]] = []
    if payload.history:
        recent_history = payload.history[-10:]
        for h in recent_history:
            formatted_context.append({"role": h.role, "content": h.content})

    formatted_context.append({"role": "user", "content": clean_message})

    async def sse_guest_stream():
        try:
            async for token in openrouter_service.stream_chat_completion(
                formatted_context,
                model=resolved_model
            ):
                yield f"data: {json.dumps({'chunk': token})}\n\n"

            yield f"data: {json.dumps({'done': True, 'guest': True})}\n\n"
        except Exception as exc:
            logger.error("Error during guest streaming completion: %s", exc)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        sse_guest_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("")
async def send_chat_message(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sends a chat message and returns a real-time Server-Sent Events (SSE) stream of the assistant's reply.
    Persists the user and assistant messages in PostgreSQL under the authenticated user's conversation.
    """
    clean_message = payload.message.strip()
    if not clean_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )

    try:
        resolved_model = validate_and_resolve_model(payload.model)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )

    # 1. Resolve or create conversation
    if payload.conversation_id:
        conv_query = select(Conversation).where(
            Conversation.id == payload.conversation_id,
            Conversation.user_id == current_user.id
        )
        result = await db.execute(conv_query)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
    else:
        conversation = Conversation(
            user_id=current_user.id,
            title="New Chat"
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    conv_id = conversation.id

    # 2. Save user message to database
    user_msg = Message(
        conversation_id=conv_id,
        role="user",
        content=clean_message
    )
    db.add(user_msg)

    # 3. Auto-update title if it's the initial message
    if conversation.title == "New Chat":
        derived_title = clean_message[:40] + ("..." if len(clean_message) > 40 else "")
        conversation.title = derived_title

    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # 4. Fetch chronological conversation history for LLM context (up to last 20 messages)
    history_query = (
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.desc())
        .limit(20)
    )
    history_res = await db.execute(history_query)
    messages_chronological = list(reversed(history_res.scalars().all()))

    formatted_context = [
        {"role": m.role, "content": m.content}
        for m in messages_chronological
    ]

    # 5. SSE stream generator
    async def sse_event_stream():
        collected_response: List[str] = []
        try:
            async for token in openrouter_service.stream_chat_completion(
                formatted_context,
                model=resolved_model
            ):
                collected_response.append(token)
                yield f"data: {json.dumps({'chunk': token})}\n\n"

            full_reply = "".join(collected_response)

            # Persist assistant response to PostgreSQL
            assistant_msg = Message(
                conversation_id=conv_id,
                role="assistant",
                content=full_reply
            )
            db.add(assistant_msg)
            conversation.updated_at = datetime.now(timezone.utc)
            await db.commit()
            saved_msg_id = str(assistant_msg.id)

            yield f"data: {json.dumps({'done': True, 'conversation_id': str(conv_id), 'message_id': saved_msg_id})}\n\n"

        except Exception as exc:
            logger.error("Error during streaming completion: %s", exc)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
