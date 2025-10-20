from pydantic import BaseModel
from datetime import datetime

class AssistantUsageCreate(BaseModel):
    user_id: int
    model: str
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    duration: float | None = None

class AssistantUsageOut(AssistantUsageCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True