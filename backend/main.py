"""
HireMind — FastAPI Application Entry Point
Sets up CORS, routers, startup events, and health check.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from db.session import create_tables
from api import interview, resume, auth, report, payments


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup/shutdown tasks."""
    # Create DB tables in development (use Alembic in production)
    if settings.DEBUG:
        await create_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_VERSION,
    description="AI-powered mock interview platform — personalized by resume, JD, and company.",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(report.router)
app.include_router(payments.router)


# ── Health Check ──────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.API_VERSION}


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to HireMind AI API",
        "docs": "/docs",
        "version": settings.API_VERSION,
    }
