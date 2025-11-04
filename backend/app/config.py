from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn, field_validator
from dotenv import load_dotenv
import os

load_dotenv() 

class Settings(BaseSettings):
    app_name: str = Field(..., env="APP_NAME")
    app_env: str = Field("development", env="APP_ENV")
    app_host: str = Field("0.0.0.0", env="APP_HOST")
    app_port: int = Field(8000, env="APP_PORT")

    db_user: str = Field(..., env="DB_USER")
    db_password: str = Field(..., env="DB_PASSWORD")
    db_host: str = Field(..., env="DB_HOST")
    db_port: int = Field(5432, env="DB_PORT")
    db_name: str = Field(..., env="DB_NAME")
    database_url: PostgresDsn | None = None

    secret_key: str = Field(..., env="SECRET_KEY")
    access_token_expire_minutes: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(7, env="REFRESH_TOKEN_EXPIRE_DAYS")


    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    openai_timeout: int = Field(15, env="OPENAI_TIMEOUT")
    openai_max_retries: int = Field(3, env="OPENAI_MAX_RETRIES")

    redis_url: str = Field("redis://localhost:6379", env="REDIS_URL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

        extra = "allow"

    # validator for database_url
    @field_validator("database_url", mode="before")
    def assemble_db_url(cls, v, info):
        if v is not None:
            return v
        return f"postgresql+asyncpg://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

settings = Settings()
