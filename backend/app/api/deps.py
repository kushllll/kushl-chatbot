from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_id_token
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = await verify_id_token(credentials.credentials)
    firebase_uid = claims.get("uid")
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing UID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Resolve or auto-provision user in PostgreSQL
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if not user:
        email = claims.get("email") or f"{firebase_uid}@users.kushalchat.ai"
        display_name = claims.get("name")
        photo_url = claims.get("picture")

        user = User(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name,
            photo_url=photo_url,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user
