"""
HireMind — Celery Worker
Handles background scoring jobs so the main API stays fast.
"""

from celery import Celery
from core.config import settings

# ── Celery App ────────────────────────────────────────────────────────
celery_app = Celery(
    "hiremind",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
