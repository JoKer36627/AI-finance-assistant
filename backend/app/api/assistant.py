from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy import select
import json
import redis.asyncio as redis
import tiktoken

from app.config import settings
from app.core.security import get_current_user_from_token as get_current_user
from app.schemas.assistant import create_assistant_message, ChatRequest, ChatResponse
from app.db.session import get_session
from app.logger import log_event
from app.models.survey import SurveyResult
from app.models.user import User
from app.models.assistant_message import AssistantManager
from app.core.openai_client import send_message, SYSTEM_PROMPT

router = APIRouter(prefix="/assistant", tags=["assistant"])

MAX_HISTORY = 10
MAX_TOKENS = 3000
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
        raise HTTPException(status_code=429, detail="Too many requests, please wait a minute")
    pipe = r.pipeline()
    pipe.incr(key, amount=1)
    pipe.expire(key, 60)
    await pipe.execute()

def truncate_prompt_by_tokens(messages: list, max_tokens: int = MAX_TOKENS) -> list:
    """Truncates the message context by token count."""
    encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
    total_tokens = 0
    truncated = []
    for msg in reversed(messages):  # start from the latest
        tokens = len(encoding.encode(msg["content"]))
        if total_tokens + tokens > max_tokens:
            break
        truncated.insert(0, msg)
        total_tokens += tokens
    return truncated

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    try:
        await check_rate_limit(current_user)
        log_event("assistant_request", user_id=current_user, message=request.message[:100])

        # --- Saving the user's request ---
        await create_assistant_message(session, current_user, "user", request.message)

        # --- History ---
        history_msgs: List = await AssistantManager.get_history(session, current_user, limit=MAX_HISTORY)

        # --- Fetching User and Survey ---
        user = await session.get(User, current_user)
        result = await session.execute(
            select(SurveyResult)
            .where(SurveyResult.user_id == current_user)
            .order_by(SurveyResult.created_at.desc())
        )
        survey = result.scalars().first()

        # --- Constructing messages ---
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if user:
            user_context = {
                "name": user.name,
                "email": user.email,
                "verified": user.is_verified
            }
            messages.append({"role": "system", "content": f"User context: {json.dumps(user_context, ensure_ascii=False)}"})

        if survey:
            messages.append({"role": "system", "content": f"Survey context: {json.dumps(survey.answers, ensure_ascii=False)}"})

        for msg in history_msgs:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": request.message})

        # --- Truncate the prompt ---
        messages = truncate_prompt_by_tokens(messages, MAX_TOKENS)

        # --- Calling OpenAI ---
        ai_reply = await send_message(messages=messages, user_id=current_user, context=request.context)

        # --- Saving AI response ---
        await create_assistant_message(session, current_user, "assistant", ai_reply)
        log_event("assistant_response", user_id=current_user, response=ai_reply[:200])

        return ChatResponse(reply=ai_reply)

    except HTTPException:
        raise
    except Exception as e:
        log_event("assistant_error", user_id=current_user, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error processing request to AI assistant")