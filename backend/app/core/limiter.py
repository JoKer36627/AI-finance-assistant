from slowapi import Limiter
from slowapi.util import get_remote_address

# limiter for all proj
limiter = Limiter(key_func=get_remote_address)
