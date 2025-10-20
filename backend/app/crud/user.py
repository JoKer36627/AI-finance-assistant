from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models, schemas
from app.core.security import hash_password
from app.models.user import User


async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(models.User).filter(models.User.email == email))
    return result.scalars().first()


async def create_user(db: AsyncSession, user_in: schemas.user.UserCreate):
    hashed_pw = hash_password(user_in.password)
    db_user = models.User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_pw,
        is_active=True
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def save_refresh_token(db: AsyncSession, user_id: int, token: str):
    result = await db.execute(select(User).filter_by(id=user_id))
    user = result.scalars().first()
    if user:
        user.refresh_token = token
        db.add(user)
        await db.commit()

async def remove_refresh_token(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).filter_by(id=user_id))
    user = result.scalars().first()
    if user:
        user.refresh_token = None
        db.add(user)
        await db.commit()

async def verify_user_email(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).filter_by(id=user_id))
    user = result.scalars().first()
    if user:
        user.is_verified = True
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalars().first()

async def update_user(db: AsyncSession, user: User, user_in: schemas.user.UserUpdate):
    if user_in.name is not None:
        user.name = user_in.name
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user