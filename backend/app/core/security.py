import asyncio
import logging
from typing import Optional
from fastapi import HTTPException, status
import jwt
from jwt import PyJWKClient
from app.core.config import settings

logger = logging.getLogger(__name__)

_jwks_client: Optional[PyJWKClient] = None


def get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client
    if _jwks_client is None and settings.NEON_AUTH_JWKS_URL:
        _jwks_client = PyJWKClient(
            settings.NEON_AUTH_JWKS_URL,
            cache_jwk_set=True,
            lifespan=3600
        )
    return _jwks_client


async def verify_id_token(token: str) -> dict:
    """
    Verifies a Neon Auth JWT token and returns decoded claims.
    Validates EdDSA (Ed25519) asymmetric signature against Neon Auth JWKS endpoint.
    Supports a deterministic test token prefix in non-production environments for automated testing.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fast deterministic token ONLY in non-production environments for automated testing
    is_production = settings.ENVIRONMENT.lower().strip() in ("production", "prod")
    if not is_production and token.startswith("mock-test-token:"):
        parts = token.split(":")
        mock_auth_id = parts[1] if len(parts) > 1 else "mock_test_uid"
        mock_email = parts[2] if len(parts) > 2 else f"{mock_auth_id}@example.com"
        return {
            "sub": mock_auth_id,
            "email": mock_email,
            "name": f"User {mock_auth_id}",
            "picture": None,
        }

    jwks_client = get_jwks_client()
    if not jwks_client:
        logger.error("NEON_AUTH_JWKS_URL is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication provider is not configured",
        )

    try:
        # Resolve signing key from token header kid via JWKS
        signing_key = await asyncio.to_thread(jwks_client.get_signing_key_from_jwt, token)
        claims = await asyncio.to_thread(
            jwt.decode,
            token,
            signing_key.key,
            algorithms=["EdDSA"],
            options={"verify_exp": True, "verify_aud": False},
        )
        return claims
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        logger.warning("Token verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.warning("Token verification unexpected error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
