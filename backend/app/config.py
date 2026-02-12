from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "super-secret-key-change-in-production"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "UDSM Student Hub API"

    DATABASE_URL: str = "postgresql+asyncpg://lms_user:lms_password@localhost/lms_db"
    ASYNC_DATABASE_URL: str = "postgresql+asyncpg://lms_user:lms_password@localhost/lms_db"
    SYNC_DATABASE_URL: str = "postgresql://lms_user:lms_password@localhost/lms_db"
    REDIS_URL: str = "redis://localhost:6379"

    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_PRIVATE_KEY_PATH: str = "./keys/private.pem"
    JWT_PUBLIC_KEY_PATH: str = "./keys/public.pem"

    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    AT_API_KEY: str = ""
    AT_USERNAME: str = "sandbox"
    AT_SENDER_ID: str = "UDSM"

    STORAGE_PROVIDER: str = "minio"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "udsm-lms"
    MINIO_SECURE: bool = False

    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_REGION: str = "us-east-1"
    S3_BUCKET: str = ""

    OPENAI_API_KEY: str = ""
    ENABLE_RISK_PREDICTION: bool = True

    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"])


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
