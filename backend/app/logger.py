from loguru import logger
import sys
import json
from datetime import datetime

# Remove default handlers
logger.remove()

# Output JSON to stdout
logger.add(
    sys.stdout,
    format="{message}",
    serialize=True,
    level="INFO",
)

PII_FIELDS = {"email", "name", "password", "capital", "income", "token", "refresh_token"}

def sanitize_value(value, max_len: int = 300):
    """Cleans text from potential PII and limits its length."""
    if not value:
        return ""
    if isinstance(value, (dict, list)):
        return "[object]"
    text = str(value).replace("\n", " ").strip()
    for f in PII_FIELDS:
        if f in text.lower():
            text = text.replace(f, "[REDACTED]")
    if len(text) > max_len:
        text = text[:max_len] + "..."
    return text

def log_event(event_name: str, user_id: int = None, **kwargs):
    """
    Logs an event in JSON format (without PII).
    """
    payload = {
        "event": event_name,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
    }

    for key, val in kwargs.items():
        payload[key] = sanitize_value(val)

    logger.info(json.dumps(payload, ensure_ascii=False))