from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.schemas.feedback import FeedbackCreate, FeedbackInDB
from app.crud import feedback as crud_feedback
from app.core.security import get_current_user_from_token

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("/", response_model=FeedbackInDB)
async def create_feedback(
    feedback_in: FeedbackCreate,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    db_feedback = await crud_feedback.create_feedback(db, user_id, feedback_in)
    return db_feedback

@router.get("/me", response_model=list[FeedbackInDB])
async def read_my_feedback(
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    feedbacks = await crud_feedback.get_feedback_by_user(db, user_id)
    return feedbacks
