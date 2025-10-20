from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.models.assistant import AssistantMessage
from pydantic import BaseModel

async def create_assistant_message(db: AsyncSession, user_id: int, role: str, content: str) -> AssistantMessage:
    msg = AssistantMessage(user_id=user_id, role=role, content=content)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg

class ChatRequest(BaseModel):
    message: str
    context: dict | None = None

class ChatResponse(BaseModel):
    reply: str