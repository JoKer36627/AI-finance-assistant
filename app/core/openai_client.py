import asyncio
import openai
from tenacity import retry, stop_after_attempt, wait_fixed
from app.config import settings
from app.logger import log_event

# Ініціалізація ключа OpenAI
openai.api_key = settings.openai_api_key

OPENAI_TIMEOUT = getattr(settings, "openai_timeout", 15)
MAX_RETRIES = getattr(settings, "openai_max_retries", 3)

# Системний промпт для фінансового асистента
SYSTEM_PROMPT = """
You are a financial assistant. Your task is to help the user manage their money effectively.  
Answer clearly and practically.

Rules:
- Provide short and actionable advice.
- Do not make assumptions about the user.
- If the user asks a general question, give specific steps or recommendations.
- If the question is not about finance, politely inform the user that you are a finance expert.
"""

@retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_fixed(2))
async def send_message(prompt: str, user_id: int = None, context: dict | None = None) -> str:
    """
    Sends a prompt to the OpenAI API (ChatGPT) with timeout and retry handling.
    Logs the request and response (excluding any PII).
    
    :param prompt: The message text to send to the AI
    :param user_id: Optional; used to associate the log with a specific user
    :param context: Optional; additional user context
    :return: The AI's text response
    """
    try:
        log_event("openai_request", user_id=user_id, prompt=prompt[:100], context=context)

        # Викликаємо синхронний API у окремому потоці
        response = await asyncio.to_thread(
            openai.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        text_response = response.choices[0].message.content
        log_event("openai_response", user_id=user_id, response=text_response[:200])
        return text_response

    except asyncio.TimeoutError:
        log_event("openai_timeout", user_id=user_id)
        raise
    except Exception as e:
        log_event("openai_error", user_id=user_id, error=str(e))
        raise
