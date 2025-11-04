from sqlalchemy import Column, Integer, ForeignKey, String, JSON, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String, nullable=False)  # наприклад: "advice_accepted", "clicked_link"
    meta = Column(JSON, nullable=True)       # додаткові дані про подію
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="events")
    message = relationship("Message", backref="events")