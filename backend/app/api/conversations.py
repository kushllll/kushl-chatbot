import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    ConversationUpdate,
)

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all conversations for the authenticated user ordered by updated_at descending.
    Includes message count for each conversation.
    """
    query = (
        select(Conversation, func.count(Message.id).label("message_count"))
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == current_user.id)
        .group_by(Conversation.id)
        .order_by(Conversation.updated_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    response = []
    for conv, count in rows:
        item = ConversationResponse.model_validate(conv)
        item.message_count = count
        response.append(item)

    return response


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new conversation for the authenticated user.
    """
    conversation = Conversation(
        user_id=current_user.id,
        title=payload.title or "New Chat"
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    resp = ConversationResponse.model_validate(conversation)
    resp.message_count = 0
    return resp


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve a specific conversation along with all its chronological messages.
    Ensures the conversation belongs to the authenticated user.
    """
    query = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    resp = ConversationDetailResponse.model_validate(conversation)
    resp.message_count = len(conversation.messages)
    return resp


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: uuid.UUID,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a conversation's title.
    """
    query = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    conversation.title = payload.title.strip()
    await db.commit()
    await db.refresh(conversation)

    return ConversationResponse.model_validate(conversation)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a conversation and all its messages.
    """
    query = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    await db.delete(conversation)
    await db.commit()
    return None
