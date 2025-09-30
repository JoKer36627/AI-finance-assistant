from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.db.base import Base

class AssistantMessage(Base):
    __tablename__ = "assistant_messages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
