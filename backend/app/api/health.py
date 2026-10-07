from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "model": settings.OPENROUTER_MODEL,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
