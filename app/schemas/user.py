from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


# ---- Base ----
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


# ---- Create ----
class UserCreate(UserBase):
    password: str


# ---- Login ----
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ---- Update ----
class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None


# ---- Response ----
class UserRead(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    verification_token: Optional[str] = None

    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VerifyEmailResponse(BaseModel):
    message: str


# ---- JWT Schemas ----
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
