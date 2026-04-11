import time
from emergentintegrations.llm.chat import LlmChat, UserMessage
from app.config import settings
from app.logger import log_event
from app.models.assistant_usage import AssistantUsageLog
from app.db.session import AsyncSessionLocal
import os

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", settings.openai_api_key)

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

1. Be practical, not theoretical. Give actionable advice.
2. Be concise and direct. Answer in short, natural prose unless the user explicitly asks for a list.
3. Focus on patterns: spending categories, trends, anomalies, risks.
4. Always prioritize: saving money, improving efficiency, reducing unnecessary expenses, increasing income opportunities.
5. When analyzing data: highlight the most important insight first, quantify when possible, avoid generic advice.
6. Tone: professional, direct, not overly friendly, not robotic.
7. If user asks general question: answer clearly, relate to their financial situation if possible.
8. If user provides transactions: analyze them, summarize spending behavior, give improvement suggestions.
9. Never say "I am just an AI" or similar disclaimers.
10. Always aim to be useful, not verbose.
11. Do not default to bullet points. Use clear sentences and concrete recommendations.
12. Answer in the same language the user writes in.
"""


async def send_message(messages: list, user_id: int = None, context: dict | None = None) -> str:
    start_time = time.time()
    try:
        log_event("openai_request", user_id=user_id, prompt_preview=str(messages)[:300], context=context)

        # Build system message from all system messages
        system_parts = []
        user_messages_text = []
        for msg in messages:
            if msg["role"] == "system":
                system_parts.append(msg["content"])
            elif msg["role"] == "user":
                user_messages_text.append(msg["content"])
            elif msg["role"] == "assistant":
                user_messages_text.append(f"[Assistant previously said]: {msg['content']}")

        full_system = "\n\n".join(system_parts)
        
        # Use the last user message as the primary message
        last_user_msg = user_messages_text[-1] if user_messages_text else "Hello"
        
        # Build context from previous messages
        history_context = ""
        if len(user_messages_text) > 1:
            history_context = "\n\nPrevious conversation:\n" + "\n".join(user_messages_text[:-1])

        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"user_{user_id}_{int(time.time())}",
            system_message=full_system + history_context
        ).with_model("openai", "gpt-4o-mini")

        user_message = UserMessage(text=last_user_msg)
        text_response = await chat.send_message(user_message)

        duration = round(time.time() - start_time, 2)
        log_event("openai_response", user_id=user_id, duration=duration)
        log_event("openai_message_text", user_id=user_id, response_preview=str(text_response)[:200])

        await save_usage_log(user_id, "gpt-4o-mini", None, duration)

        return str(text_response)

    except Exception as e:
        log_event("openai_error", user_id=user_id, error=str(e))
        raise


async def save_usage_log(user_id: int, model: str, usage, duration: float):
    try:
        async with AsyncSessionLocal() as session:
            log = AssistantUsageLog(
                user_id=user_id,
                model=model or "unknown",
                prompt_tokens=0,
                completion_tokens=0,
                total_tokens=0,
                duration=duration
            )
            session.add(log)
            await session.commit()
    except Exception:
        pass
