from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate

async def create_feedback(db: AsyncSession, user_id: int, feedback_in: FeedbackCreate) -> Feedback:
    db_feedback = Feedback(
        user_id=user_id,
        message_id=feedback_in.message_id, 
        rating=feedback_in.rating, 
        comment=feedback_in.comment
    )
    db.add(db_feedback)
    await db.commit()
    await db.refresh(db_feedback)
    return db_feedback

async def get_feedback_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Feedback).where(Feedback.user_id == user_id).order_by(Feedback.created_at.desc())
    )
    return result.scalars().all()
