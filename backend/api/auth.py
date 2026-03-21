"""
HireMind — Auth API Routes
POST /api/auth/sync    → Sync Clerk user to our DB
GET  /api/auth/me      → Get current user profile
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, date

from db.session import get_db
from db.models import User, PlanTier
from schemas.schemas import UserSyncRequest, UserResponse
from core.security import verify_clerk_token, CurrentUser

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/sync", response_model=UserResponse)
async def sync_user(
    body: UserSyncRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """Upsert Clerk user to our database on first sign-in."""
    result = await db.execute(select(User).where(User.id == body.clerk_id))
    existing = result.scalar_one_or_none()

    if existing:
        existing.email = body.email
        existing.name = body.name
        existing.avatar_url = body.avatar_url
        await db.commit()
        await db.refresh(existing)
        return existing

    new_user = User(
        id=body.clerk_id,
        email=body.email,
        name=body.name,
        avatar_url=body.avatar_url,
        plan=PlanTier.FREE,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    result = await db.execute(select(User).where(User.id == user["sub"]))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found. Call /sync first.")

    # Reset daily count if new day
    today = date.today()
    if db_user.last_reset_date and db_user.last_reset_date.date() < today:
        db_user.daily_interviews_used = 0
        db_user.last_reset_date = datetime.utcnow()
        await db.commit()
        await db.refresh(db_user)

    return db_user
