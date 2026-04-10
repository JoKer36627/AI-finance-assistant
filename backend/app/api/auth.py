from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.core.limiter import limiter
from app.crud.user import (
    get_user_by_email,
    create_user,
    save_refresh_token,
    remove_refresh_token,
    verify_user_email,
)
from app.crud.event import create_event
from app.db.session import get_session
from app.schemas.event import EventCreate
from app.schemas.user import UserCreate, UserRead, UserLogin, Token, VerifyEmailResponse
from app.models.user import User
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    create_verification_token,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


async def safe_create_auth_event(db: AsyncSession, user_id: int, event_type: str, meta: dict | None = None):
    try:
        await create_event(
            db,
            user_id,
            EventCreate(event_type=event_type, meta=meta or {}),
        )
    except SQLAlchemyError:
        await db.rollback()


# --- Register ---
@router.post("/register", response_model=UserRead)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_session)):
    existing_user = await get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = await create_user(db, user_in=user_in)

    # Generate verification_token (simulate sending via email)
    verification_token = create_verification_token(new_user.id)

    return {
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "is_active": new_user.is_active,
        "is_verified": new_user.is_verified,
        "created_at": new_user.created_at,
        "verification_token": verification_token  # 🔹 frontend will receive the token for MVP
    }


# --- Verify Email ---
@router.get("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_session)):
    payload = decode_token(token)
    if not payload or payload.get("type") != "verify":
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user_id = payload["user_id"]
    user = await verify_user_email(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Email successfully verified"}


# --- Login ---
@router.post("/login", response_model=Token)
@limiter.limit("100/minute" if settings.app_env == "development" else "5/minute")
async def login(request: Request, user_in: UserLogin, db: AsyncSession = Depends(get_session)):
    user = await get_user_by_email(db, email=user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_verified and settings.app_env != "development":
        raise HTTPException(status_code=403, detail="Email not verified")

    access_token = create_access_token(data={"user_id": user.id})
    refresh_token = create_refresh_token(data={"user_id": user.id})

    # 🔹 Save the refresh token in the database
    await save_refresh_token(db, user.id, refresh_token)
    await safe_create_auth_event(
        db,
        user.id,
        "user_logged_in",
        {"email": user.email},
    )

    response = JSONResponse(
        content={"access_token": access_token, "token_type": "bearer"}
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # 🔹 locally
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    return response


# --- Refresh ---
@router.post("/refresh", response_model=Token)
async def refresh_token(request: Request, db: AsyncSession = Depends(get_session)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload["user_id"]
    result = await db.execute(select(User).filter_by(id=user_id))
    user = result.scalars().first()
    if not user or user.refresh_token != refresh_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access_token = create_access_token(data={"user_id": user_id})
    return {"access_token": new_access_token, "token_type": "bearer"}


# --- Logout ---
@router.post("/logout")
async def logout(request: Request, db: AsyncSession = Depends(get_session)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload["user_id"]
    await remove_refresh_token(db, user_id)

    response = JSONResponse(content={"detail": "Logged out successfully"})
    response.delete_cookie("refresh_token")
    return response
