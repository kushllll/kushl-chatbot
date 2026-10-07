import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[uuid.UUID] = None
    model: Optional[str] = None


class GuestChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(max_length=4000)


class GuestChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    model: Optional[str] = None
    history: Optional[List[GuestChatMessage]] = Field(default=None, max_length=20)


class ChatStreamChunk(BaseModel):
    chunk: Optional[str] = None
    done: bool = False
    guest: Optional[bool] = None
    conversation_id: Optional[uuid.UUID] = None
    message_id: Optional[uuid.UUID] = None
    error: Optional[str] = None
