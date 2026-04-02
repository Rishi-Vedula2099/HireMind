"""
HireMind — Security Utilities
Handles JWT verification from Clerk and internal token helpers.
"""

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from core.config import settings

bearer_scheme = HTTPBearer()


async def get_clerk_public_keys() -> dict:
    """Fetch Clerk JWKS for token verification."""
    jwks_url = f"{settings.CLERK_JWT_ISSUER}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        return response.json()


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Dependency: validates Clerk JWT and returns the decoded payload.
    Raises 401 if invalid.
    """
    token = credentials.credentials
    try:
        # Decode without verification first to get 'kid'
        header = jwt.get_unverified_header(token)
        jwks = await get_clerk_public_keys()
        # Find the matching key
        public_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == header.get("kid"):
                public_key = key
                break
        if not public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Public key not found",
            )
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


# ── Convenience type alias ──────────────────────────────────────────
CurrentUser = dict  # The decoded JWT payload dict
