import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MessageBase(BaseModel):
    role: str
    content: str


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: uuid.UUID
    conversation_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
