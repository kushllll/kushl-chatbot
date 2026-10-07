import asyncio
import json
import logging
from typing import Optional
import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Firebase Admin once
_firebase_app = None


def init_firebase() -> Optional[firebase_admin.App]:
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        return _firebase_app

    try:
        if settings.FIREBASE_CREDENTIALS_JSON:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized with credentials JSON")
        elif settings.FIREBASE_PROJECT_ID:
            _firebase_app = firebase_admin.initialize_app(
                options={"projectId": settings.FIREBASE_PROJECT_ID}
            )
            logger.info("Firebase Admin initialized with project ID: %s", settings.FIREBASE_PROJECT_ID)
        else:
            logger.warning("Firebase not configured with project ID or credentials JSON. Real token verification will be inactive.")
    except Exception as e:
        logger.error("Failed to initialize Firebase Admin SDK: %s", e)

    return _firebase_app


init_firebase()


async def verify_id_token(token: str) -> dict:
    """
    Verifies a Firebase ID token and returns decoded claims.
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
        mock_uid = parts[1] if len(parts) > 1 else "mock_test_uid"
        mock_email = parts[2] if len(parts) > 2 else f"{mock_uid}@example.com"
        return {
            "uid": mock_uid,
            "email": mock_email,
            "name": f"User {mock_uid}",
            "picture": None,
        }

    try:
        decoded_claims = await asyncio.to_thread(auth.verify_id_token, token)
        return decoded_claims
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.warning("Token verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
