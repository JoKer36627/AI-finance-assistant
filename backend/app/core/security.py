from passlib.context import CryptContext
from datetime import datetime, timedelta, UTC
from base64 import urlsafe_b64encode
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from app.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
jwt_handler = jwt.JWT() if hasattr(jwt, "JWT") else None


def build_jwt_key():
    if not hasattr(jwt, "jwk_from_dict"):
        return None
    encoded_secret = urlsafe_b64encode(settings.secret_key.encode()).rstrip(b"=").decode()
    return jwt.jwk_from_dict({"kty": "oct", "k": encoded_secret})


def normalize_jwt_payload(payload: dict) -> dict:
    normalized = payload.copy()
    exp = normalized.get("exp")
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=UTC)
        normalized["exp"] = int(exp.timestamp())
    return normalized


def jwt_encode(payload: dict) -> str:
    prepared_payload = normalize_jwt_payload(payload)
    if hasattr(jwt, "encode"):
        return jwt.encode(prepared_payload, settings.secret_key, algorithm="HS256")
    return jwt_handler.encode(prepared_payload, build_jwt_key(), alg="HS256")


def jwt_decode(token: str) -> dict | None:
    try:
        if hasattr(jwt, "decode"):
            return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return jwt_handler.decode(
            token,
            build_jwt_key(),
            algorithms={"HS256"},
            do_time_check=True,
        )
    except Exception:
        return None

# --- Password ---
def hash_password(password: str) -> str:
    max_len = 72
    truncated_pw = password[:max_len]
    return pwd_context.hash(truncated_pw)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password[:72], hashed_password)

# --- JWT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt_encode(to_encode)

def decode_token(token: str):
    return jwt_decode(token)

# --- OAuth2 ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user_from_token(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload["user_id"]

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(days=7)  # можеш винести у .env
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt_encode(to_encode)

def create_verification_token(user_id: int, expires_delta: Optional[timedelta] = None):
    to_encode = {"user_id": user_id, "type": "verify"}
    expire = datetime.now(UTC) + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt_encode(to_encode)
