from loguru import logger
import sys

# Очищаємо стандартні хендлери
logger.remove()

# Додаємо хендлер для JSON у консоль
logger.add(
    sys.stdout,
    format="{message}",  # весь лог буде у форматі JSON
    serialize=True,      # робить лог JSON
    level="INFO",
)

def log_event(event_name: str, **kwargs):
    """
    Допоміжна функція для логування подій.
    event_name: назва події
    kwargs: додаткові поля, наприклад user_id, endpoint, status
    """
    payload = {"event": event_name}
    payload.update(kwargs)
    logger.info(payload)

    
