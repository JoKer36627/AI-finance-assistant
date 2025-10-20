from slowapi import Limiter
from slowapi.util import get_remote_address

# 🔹 Лімітер для всього проєкту
limiter = Limiter(key_func=get_remote_address)
