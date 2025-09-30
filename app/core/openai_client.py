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
Ти — фінансовий асистент. Твоя задача — допомагати користувачу керувати своїми грошима. 
Відповідай чітко та практично.  

Правила:
- Короткі і зрозумілі поради.
- Не вигадуй фактів про користувача.
- Якщо користувач задає загальне питання, дай конкретні кроки або поради.
- Якщо запитання не про фінанси, чемно повідом користувача, що ти експерт у фінансах.
"""

@retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_fixed(2))
async def send_message(prompt: str, user_id: int = None, context: dict | None = None) -> str:
    """
    Відправляє prompt до OpenAI API (ChatGPT) з таймаутом і ретраями.
    Логування запиту і відповіді (без PII).

    :param prompt: текст повідомлення для AI
    :param user_id: optional, для зв'язку з користувачем у логах
    :param context: optional, додатковий контекст користувача
    :return: текстова відповідь AI
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
