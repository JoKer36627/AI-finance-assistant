from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from app.core.limiter import limiter
from fastapi import Request
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.api import survey
from fastapi.openapi.utils import get_openapi

from app.config import settings
from app.logger import log_event
from app.api import user, auth, message, feedback
from fastapi.exceptions import RequestValidationError
from app.api import assistant




# --- FastAPI app ---
app = FastAPI(title=settings.app_name)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# 🔹 Підключаємо middleware для rate-limit
app.add_exception_handler(RateLimitExceeded, lambda request, exc: log_event("rate_limit_exceeded", url=str(request.url)))

# --- OAuth2 ---                
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# --- Middleware для логування ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    log_event(
        event_name="request_received",
        method=request.method,
        url=str(request.url)
    )
    response = await call_next(request)
    log_event(
        event_name="request_completed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code
    )
    return response

# --- Health-check ---
@app.get("/healthz")
def health_check():
    return {"status": "ok", "env": settings.app_env}

# --- Rate limit handler ---
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many login attempts, try again later."},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"] if loc != "body")
        errors.append({"field": field, "msg": err["msg"]})
    return JSONResponse(
        status_code=422,
        content={"detail": errors},
    )


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="My API",
        version="1.0.0",
        description="API with JWT",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema



# --- Підключаємо роутери ---
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(survey.router)
app.include_router(message.router)
app.include_router(feedback.router)
app.openapi = custom_openapi
app.include_router(assistant.router)
