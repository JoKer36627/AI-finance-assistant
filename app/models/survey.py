from sqlalchemy import Column, Integer, ForeignKey, JSON, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class SurveyResult(Base):
    __tablename__ = "survey_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    answers = Column(JSON, nullable=False)  # збереження відповідей у форматі JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="survey_results")
