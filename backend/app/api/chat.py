import json
import logging
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import ChatRequest
from app.services.openrouter import openrouter_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


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
            async for token in openrouter_service.stream_chat_completion(formatted_context):
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
