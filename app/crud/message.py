from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.message import Message
from app.schemas.message import MessageCreate

async def create_message(db: AsyncSession, user_id: int, message_in: MessageCreate) -> Message:
    db_message = Message(user_id=user_id, role=message_in.role, content=message_in.content)
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message

async def get_messages_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Message).where(Message.user_id == user_id).order_by(Message.created_at.desc())
    )
    return result.scalars().all()

async def get_message_by_id(db: AsyncSession, id: int):
    result = await db.execute(select(Message).where(Message.id == id))
    return result.scalar_one_or_none()
