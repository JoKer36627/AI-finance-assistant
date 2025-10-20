import asyncio
import time
import openai
from tenacity import retry, stop_after_attempt, wait_fixed
from app.config import settings
from app.logger import log_event
from app.models.assistant_usage import AssistantUsageLog
from app.db.session import AsyncSessionLocal

# Ініціалізація ключа OpenAI
openai.api_key = settings.openai_api_key

OPENAI_TIMEOUT = getattr(settings, "openai_timeout", 15)
MAX_RETRIES = getattr(settings, "openai_max_retries", 3)

# Системний промпт для фінансового асистента
SYSTEM_PROMPT = """
Ти — фінансовий асистент. Твоя задача — допомагати користувачу керувати своїми грошима. 
Відповідай чітко та практично, базуючись на наданому контексті користувача.

Правила:
- Використовуй дані з User context та Survey context для персоналізованих порад.
- Короткі і зрозумілі поради.
- Не вигадуй фактів про користувача.
- Якщо користувач задає загальне питання, дай конкретні кроки або поради.
- Якщо запитання не про фінанси, чемно повідом користувача, що ти експерт у фінансах.
"""

@retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_fixed(2))
async def send_message(messages: list, user_id: int = None, context: dict | None = None) -> str:
    """
    Відправляє messages до OpenAI API (ChatGPT) з таймаутом і ретраями.
    Логування запиту, тривалості, usage і відповіді (без PII).
    """
    start_time = time.time()
    try:
        log_event("openai_request", user_id=user_id, prompt_preview=str(messages)[:300], context=context)

        response = await asyncio.to_thread(
            openai.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        duration = round(time.time() - start_time, 2)
        usage = getattr(response, "usage", None)

        # --- Логування ---
        log_event(
            "openai_response",
            user_id=user_id,
            duration=duration,
            prompt_tokens=getattr(usage, "prompt_tokens", None),
            completion_tokens=getattr(usage, "completion_tokens", None),
            total_tokens=getattr(usage, "total_tokens", None),
            model=getattr(response, "model", None),
        )

        text_response = response.choices[0].message.content
        log_event("openai_message_text", user_id=user_id, response_preview=text_response[:200])

        # --- Збереження статистики у БД ---
        await save_usage_log(user_id, getattr(response, "model", None), usage, duration)

        return text_response

    except asyncio.TimeoutError:
        log_event("openai_timeout", user_id=user_id)
        raise
    except Exception as e:
        log_event("openai_error", user_id=user_id, error=str(e))
        raise


async def save_usage_log(user_id: int, model: str, usage, duration: float):
    """Зберігає статистику використання OpenAI у БД."""
    async with AsyncSessionLocal() as session:
        log = AssistantUsageLog(
            user_id=user_id,
            model=model,
            prompt_tokens=getattr(usage, "prompt_tokens", None),
            completion_tokens=getattr(usage, "completion_tokens", None),
            total_tokens=getattr(usage, "total_tokens", None),
            duration=duration
        )
        session.add(log)
        await session.commit()