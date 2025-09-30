from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import tiktoken
import redis.asyncio as redis

from app.config import settings
from app.core.security import get_current_user_from_token as get_current_user
from app.schemas.assistant import create_assistant_message, get_last_messages
from app.schemas.assistant import ChatRequest, ChatResponse
from app.db.session import get_session
from app.logger import log_event
from app.models.survey import SurveyResult
from sqlalchemy import select

router = APIRouter(prefix="/assistant", tags=["assistant"])

# --- Config ---
SYSTEM_PROMPT = "You are a helpful financial assistant."
MAX_HISTORY = 10
MAX_PROMPT_TOKENS = 3000
REDIS_RATE_LIMIT_KEY = "user_rate_limit:"
MAX_REQUESTS_PER_MINUTE = 5

redis_client: redis.Redis | None = None

async def get_redis_pool() -> redis.Redis:
    global redis_client
    if not redis_client:
        redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    return redis_client

async def check_rate_limit(user_id: int):
    r = await get_redis_pool()
    key = f"{REDIS_RATE_LIMIT_KEY}{user_id}"
    current = await r.get(key)
    if current and int(current) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Занадто багато запитів, зачекайте хвилину")
    pipe = r.pipeline()
    pipe.incr(key, amount=1)
    pipe.expire(key, 60)
    await pipe.execute()

def truncate_prompt_by_tokens(prompt: str, max_tokens: int) -> str:
    encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
    tokens = encoding.encode(prompt)
    if len(tokens) > max_tokens:
        tokens = tokens[-max_tokens:]
    return encoding.decode(tokens, errors="ignore")

from app.core.openai_client import send_message  # асинхронний клієнт OpenAI

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    try:
        await check_rate_limit(current_user)
        log_event("assistant_request", user_id=current_user, message=request.message[:100])

        # --- Збереження запиту користувача ---
        await create_assistant_message(session, current_user, "user", request.message)

        # --- Історія ---
        history_msgs: List = await get_last_messages(session, current_user, limit=MAX_HISTORY)

        # --- Формування prompt ---
        prompt_parts = [SYSTEM_PROMPT]
        for msg in history_msgs:
            prompt_parts.append(f"{msg.role}: {msg.content}")
        if request.context:
            prompt_parts.append(f"User context: {request.context}")

        # --- Контекст з опитування ---
        result = await session.execute(
            select(SurveyResult)
            .where(SurveyResult.user_id == current_user)
            .order_by(SurveyResult.created_at.desc())
        )
        survey = result.scalars().first()
        if survey:
            prompt_parts.append(f"Survey context: {survey.answers}")

        prompt = truncate_prompt_by_tokens("\n".join(prompt_parts), MAX_PROMPT_TOKENS)

        # --- Виклик OpenAI ---
        ai_reply = await send_message(prompt=prompt, user_id=current_user, context=request.context)

        # --- Збереження відповіді AI ---
        await create_assistant_message(session, current_user, "assistant", ai_reply)
        log_event("assistant_response", user_id=current_user, response=ai_reply[:200])

        return ChatResponse(reply=ai_reply)

    except HTTPException:
        raise
    except Exception as e:
        log_event("assistant_error", user_id=current_user, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Помилка при обробці запиту до AI асистента")
