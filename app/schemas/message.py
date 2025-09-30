from datetime import datetime
from pydantic import BaseModel
from typing import Literal, Optional

class MessageBase(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class MessageCreate(MessageBase):
    id: Optional[int] = None

class MessageInDB(MessageBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
