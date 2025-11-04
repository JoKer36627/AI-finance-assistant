from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.event import Event
from app.schemas.event import EventCreate

async def create_event(db: AsyncSession, user_id: int, event_in: EventCreate) -> Event:
    db_event = Event(
        user_id=user_id,
        message_id=event_in.message_id,
        event_type=event_in.event_type,
        meta=event_in.meta
    )
    db.add(db_event)
    await db.commit()
    await db.refresh(db_event)
    return db_event

async def get_events_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Event).where(Event.user_id == user_id).order_by(Event.created_at.desc())
    )
    return result.scalars().all()