from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.core.security import get_current_user_from_token
from app.crud.user import get_user_by_id, update_user
from app.schemas.user import UserProfile, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


# --- GET /users/me ---
@router.get("/me", response_model=UserProfile)
async def read_current_user(
    user_id: int = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_session),
):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# --- PUT /users/me ---
@router.put("/me", response_model=UserProfile)
async def update_current_user(
    user_in: UserUpdate,
    user_id: int = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_session),
):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = await update_user(db, user, user_in)
    return updated_user
