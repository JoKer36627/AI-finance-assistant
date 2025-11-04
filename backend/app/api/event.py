from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.schemas.event import EventCreate, EventResponse
from app.crud import event as crud_event
from app.core.security import get_current_user_from_token

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/", response_model=EventResponse)
async def create_event(
    event_in: EventCreate,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    db_event = await crud_event.create_event(db, user_id, event_in)
    return db_event

@router.get("/me", response_model=list[EventResponse])
async def read_my_events(
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    events = await crud_event.get_events_by_user(db, user_id)
    return events