from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class FeedbackBase(BaseModel):
    message_id: int
    rating: int = Field(ge=1, le=5, description="Rating must be between 1 and 5")
    comment: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackInDB(FeedbackBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackResponse(FeedbackBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True