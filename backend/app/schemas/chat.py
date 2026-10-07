import uuid
from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[uuid.UUID] = None


class ChatStreamChunk(BaseModel):
    chunk: Optional[str] = None
    done: bool = False
    conversation_id: Optional[uuid.UUID] = None
    message_id: Optional[uuid.UUID] = None
    error: Optional[str] = None
