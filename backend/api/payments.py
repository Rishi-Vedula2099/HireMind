"""
HireMind — Stripe Payment Routes
POST /api/payments/checkout      → Create Stripe Checkout session
POST /api/payments/webhook       → Handle Stripe webhooks (sub activation/cancellation)
GET  /api/payments/portal        → Customer billing portal
"""

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from db.models import User, PlanTier
from schemas.schemas import CheckoutSessionRequest, CheckoutSessionResponse
from core.config import settings
from core.security import verify_clerk_token, CurrentUser

stripe.api_key = settings.STRIPE_SECRET_KEY
router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout(
    body: CheckoutSessionRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """Create a Stripe Checkout session for Pro upgrade."""
    result = await db.execute(select(User).where(User.id == user["sub"]))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create or reuse Stripe customer
    if not db_user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=db_user.email,
            name=db_user.name,
            metadata={"clerk_id": db_user.id},
        )
        db_user.stripe_customer_id = customer.id
        await db.commit()

    session = stripe.checkout.Session.create(
        customer=db_user.stripe_customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": body.price_id, "quantity": 1}],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        metadata={"user_id": db_user.id},
    )
    return CheckoutSessionResponse(checkout_url=session.url)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events for subscription lifecycle."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event["type"]

    if event_type == "checkout.session.completed":
        session_obj = event["data"]["object"]
        user_id = session_obj.get("metadata", {}).get("user_id")
        subscription_id = session_obj.get("subscription")
        if user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            db_user = result.scalar_one_or_none()
            if db_user:
                db_user.plan = PlanTier.PRO
                db_user.stripe_subscription_id = subscription_id
                await db.commit()

    elif event_type in ("customer.subscription.deleted", "customer.subscription.paused"):
        sub = event["data"]["object"]
        customer_id = sub.get("customer")
        result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        db_user = result.scalar_one_or_none()
        if db_user:
            db_user.plan = PlanTier.FREE
            db_user.stripe_subscription_id = None
            await db.commit()

    return {"status": "ok"}


@router.get("/portal")
async def billing_portal(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
    return_url: str = "http://localhost:3000/dashboard",
):
    """Open the Stripe Customer portal for subscription management."""
    result = await db.execute(select(User).where(User.id == user["sub"]))
    db_user = result.scalar_one_or_none()
    if not db_user or not db_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer found")

    portal = stripe.billing_portal.Session.create(
        customer=db_user.stripe_customer_id,
        return_url=return_url,
    )
    return {"portal_url": portal.url}
