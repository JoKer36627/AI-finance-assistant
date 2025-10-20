from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.models.assistant import AssistantMessage

async def create_assistant_message(db: AsyncSession, user_id: int, role: str, content: str) -> AssistantMessage:
    msg = AssistantMessage(user_id=user_id, role=role, content=content)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg

async def get_last_messages(db: AsyncSession, user_id: int, limit: int = 10) -> List[AssistantMessage]:
    result = await db.execute(
        select(AssistantMessage)
        .where(AssistantMessage.user_id == user_id)
        .order_by(AssistantMessage.created_at.desc())
    )
    return result.scalars().all()[-limit:]
