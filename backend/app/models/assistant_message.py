from sqlalchemy import select
from app.models.assistant import AssistantMessage

class AssistantManager:
    """Manager for handling user's message history."""

    @staticmethod
    async def get_history(session, user_id: int, limit: int = 10):
        result = await session.execute(
            select(AssistantMessage)
            .where(AssistantMessage.user_id == user_id)
            .order_by(AssistantMessage.created_at.desc())
        )
        messages = result.scalars().all()
        # return in correct order (old → new)
        return list(reversed(messages[-limit:]))

    @staticmethod
    async def clear_history(session, user_id: int):
        await session.execute(
            AssistantMessage.__table__.delete().where(AssistantMessage.user_id == user_id)
        )
        await session.commit()