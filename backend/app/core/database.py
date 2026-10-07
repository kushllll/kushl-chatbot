import urllib.parse
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


def normalize_database_url(url_str: str) -> str:
    """
    Normalizes database URLs for async SQLAlchemy compatibility:
    1. Converts 'postgres://' and 'postgresql://' prefixes to 'postgresql+asyncpg://'.
    2. Strips 'channel_binding' query parameter (a libpq parameter not accepted by asyncpg kwargs).
    3. Translates 'sslmode' query parameter to 'ssl' for asyncpg compatibility while preserving SSL.
    """
    if not url_str:
        return url_str

    if url_str.startswith("postgres://"):
        url_str = url_str.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url_str.startswith("postgresql://") and not url_str.startswith("postgresql+asyncpg://"):
        url_str = url_str.replace("postgresql://", "postgresql+asyncpg://", 1)

    if not url_str.startswith("postgresql+asyncpg://"):
        return url_str

    parsed = urllib.parse.urlsplit(url_str)
    if not parsed.query:
        return url_str

    query_params = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)

    # channel_binding is a libpq parameter unsupported by asyncpg keyword arguments
    query_params.pop("channel_binding", None)

    # In asyncpg, sslmode is passed via the ssl parameter
    if "sslmode" in query_params:
        ssl_val = query_params.pop("sslmode")
        if "ssl" not in query_params:
            query_params["ssl"] = ssl_val

    new_query = urllib.parse.urlencode(query_params, doseq=True)
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment))


# Normalize database URL
db_url = normalize_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
