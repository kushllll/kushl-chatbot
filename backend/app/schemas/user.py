import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserCreate(UserBase):
    firebase_uid: str


class UserResponse(UserBase):
    id: uuid.UUID
    firebase_uid: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
