from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class FeedbackBase(BaseModel):
    message_id: int
    rating: int
    comment: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackInDB(FeedbackBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
