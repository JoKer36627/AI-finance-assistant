from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"))  # <-- додано
    rating = Column(Integer, nullable=False)  # 1–5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="feedbacks")
    message = relationship("Message", backref="feedbacks")  # <-- зв’язок з повідомленням
