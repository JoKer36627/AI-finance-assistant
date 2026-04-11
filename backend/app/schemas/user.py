from datetime import datetime
import re

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


# ---- Base ----
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


# ---- Create ----
class UserCreate(UserBase):
    password: str

    @field_validator("password")
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must include at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must include at least one lowercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must include at least one number")
        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError("Password must include at least one special character")
        return value


# ---- Login ----
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ---- Update ----
class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    def validate_password(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must include at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must include at least one lowercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must include at least one number")
        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError("Password must include at least one special character")
        return value


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
