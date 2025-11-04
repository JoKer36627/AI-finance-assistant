from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel

class EventBase(BaseModel):
    message_id: Optional[int] = None
    event_type: str
    meta: Optional[Dict] = None

class EventCreate(EventBase):
    pass

class EventInDB(EventBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EventResponse(EventBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True