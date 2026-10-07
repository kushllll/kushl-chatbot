import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.message import MessageResponse


class ConversationBase(BaseModel):
    title: str = Field(default="New Chat", max_length=255)


class ConversationCreate(BaseModel):
    title: Optional[str] = Field(default="New Chat", max_length=255)


class ConversationUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class ConversationResponse(ConversationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
