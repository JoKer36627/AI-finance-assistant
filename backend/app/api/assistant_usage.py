from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy import select

from app.db.session import get_session
from app.schemas.assistant_usage import AssistantUsageOut
from app.models.assistant_usage import AssistantUsageLog
from app.core.security import get_current_user_from_token as get_current_user

router = APIRouter(prefix="/assistant/usage", tags=["assistant_usage"])

@router.get("/", response_model=List[AssistantUsageOut])
async def get_user_usage(
    current_user: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Повертає всі usage логи для поточного користувача.
    """
    result = await session.execute(
        select(AssistantUsageLog)
        .where(AssistantUsageLog.user_id == current_user)
        .order_by(AssistantUsageLog.created_at.desc())
    )
    logs = result.scalars().all()
    return logs