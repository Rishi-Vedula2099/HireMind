"""
HireMind — Core Configuration
Reads all settings from environment variables via pydantic-settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────
    APP_NAME: str = "HireMind AI"
    DEBUG: bool = False
    API_VERSION: str = "v1"
    SECRET_KEY: str = "change-me-in-production"

    # ── Database ─────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/hiremind"

    # ── Redis / Celery ───────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # ── Auth (Clerk) ─────────────────────────────────────────────────
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_JWT_ISSUER: str = ""

    # ── AI ───────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ── Stripe ───────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_PRICE_ID: str = ""

    # ── CORS ─────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── Rate Limits ──────────────────────────────────────────────────
    FREE_DAILY_INTERVIEWS: int = 2
    PRO_DAILY_INTERVIEWS: int = 999

    # ── AI Engine paths ──────────────────────────────────────────────
    AI_ENGINE_PATH: str = "../ai-engine"
    FAISS_INDEX_PATH: str = "../ai-engine/embeddings/index"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
