from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.schemas.message import MessageCreate, MessageInDB
from app.crud import message as crud_message
from app.core.security import get_current_user_from_token

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/", response_model=MessageInDB)
async def create_message(
    message_in: MessageCreate,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    return await crud_message.create_message(db, user_id, message_in)

@router.get("/me", response_model=list[MessageInDB])
async def get_my_messages(
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    return await crud_message.get_messages_by_user(db, user_id)
