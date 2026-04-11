import asyncio
import time
import openai
from tenacity import retry, stop_after_attempt, wait_fixed
from app.config import settings
from app.logger import log_event
from app.models.assistant_usage import AssistantUsageLog
from app.db.session import AsyncSessionLocal

# Initialize OpenAI API key
openai.api_key = settings.openai_api_key

OPENAI_TIMEOUT = getattr(settings, "openai_timeout", 15)
MAX_RETRIES = getattr(settings, "openai_max_retries", 3)

# System prompt for the financial assistant
SYSTEM_PROMPT = """
You are a personal financial assistant.

Your goal is to help the user:
- understand their spending behavior
- improve financial decisions
- build better financial habits
- reach their financial goals

You have access to:
- user's transactions
- user's financial goals
- user's profile (skills, lifestyle, habits)

Your behavior must follow these rules:

1. Be practical, not theoretical.
Give actionable advice.

2. Be concise and direct.
Answer in short, natural prose unless the user explicitly asks for a list.

3. Focus on patterns:
- spending categories
- trends
- anomalies
- risks

4. Always prioritize:
- saving money
- improving efficiency
- reducing unnecessary expenses
- increasing income opportunities

5. When analyzing data:
- highlight the most important insight first
- quantify when possible
- avoid generic advice
- mention the user's tracker goal when it is relevant

6. Tone:
- professional
- direct
- not overly friendly
- not robotic

7. If user asks general question:
- answer clearly
- relate to their financial situation if possible

8. If user provides transactions:
- analyze them
- summarize spending behavior
- give improvement suggestions

9. Never say:
"I am just an AI"
or similar disclaimers.

10. Always aim to be useful, not verbose.

11. Do not default to bullet points.
Use clear sentences and concrete recommendations tailored to the user's situation.
"""

@retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_fixed(2))
async def send_message(messages: list, user_id: int = None, context: dict | None = None) -> str:
    """
    Sends messages to the OpenAI API (ChatGPT) with timeout and retries.
    Logs request, duration, usage, and response (without PII).
    """
    start_time = time.time()
    try:
        log_event("openai_request", user_id=user_id, prompt_preview=str(messages)[:300], context=context)

        response = await asyncio.to_thread(
            openai.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=500,
            timeout=OPENAI_TIMEOUT,
        )

        duration = round(time.time() - start_time, 2)
        usage = getattr(response, "usage", None)

        # --- Logging ---
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

        # --- Save usage statistics to DB ---
        await save_usage_log(user_id, getattr(response, "model", None), usage, duration)

        return text_response

    except asyncio.TimeoutError:
        log_event("openai_timeout", user_id=user_id)
        raise
    except Exception as e:
        log_event("openai_error", user_id=user_id, error=str(e))
        raise


async def save_usage_log(user_id: int, model: str, usage, duration: float):
    """Saves OpenAI usage statistics to the database."""
    async with AsyncSessionLocal() as session:
        log = AssistantUsageLog(
            user_id=user_id,
            model=model or "unknown",
            prompt_tokens=getattr(usage, "prompt_tokens", 0) or 0,
            completion_tokens=getattr(usage, "completion_tokens", 0) or 0,
            total_tokens=getattr(usage, "total_tokens", 0) or 0,
            duration=duration
        )
        session.add(log)
        await session.commit()
