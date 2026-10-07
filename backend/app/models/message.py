import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.conversation import Conversation


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role: Mapped[str] = mapped_column(
        String(32),
        nullable=False  # "user", "assistant", "system"
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="messages"
    )

    __table_args__ = (
        Index("idx_messages_conversation_created", "conversation_id", created_at.asc()),
    )
