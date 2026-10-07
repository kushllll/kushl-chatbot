import inspect
import asyncpg
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.database import normalize_database_url


def test_normalize_database_url_neon_direct():
    """
    Verifies that a Neon direct PostgreSQL URL with channel_binding=require and sslmode=require
    is sanitized for asyncpg compatibility:
    - scheme converted to postgresql+asyncpg://
    - channel_binding removed
    - sslmode converted to ssl=require
    - credentials preserved without leakage
    """
    raw_url = "postgresql://mockuser:mockpass123@ep-calm-hat-b5ikjjbs.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    normalized = normalize_database_url(raw_url)

    assert normalized.startswith("postgresql+asyncpg://mockuser:mockpass123@")
    assert "channel_binding" not in normalized
    assert "ssl=require" in normalized
    assert "sslmode" not in normalized


def test_normalize_database_url_neon_pooled():
    """
    Verifies that a Neon pooled PostgreSQL URL with postgres:// scheme
    is properly converted and sanitized.
    """
    raw_url = "postgres://mockuser:mockpass123@ep-calm-hat-b5ikjjbs-pooler.c-7.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
    normalized = normalize_database_url(raw_url)

    assert normalized.startswith("postgresql+asyncpg://mockuser:mockpass123@")
    assert "channel_binding" not in normalized
    assert "ssl=require" in normalized


def test_asyncpg_connect_args_compatibility():
    """
    Verifies that create_connect_args for the normalized URL produces
    kwargs fully accepted by asyncpg.connect() without TypeError.
    """
    raw_url = "postgresql://mockuser:mockpass123@ep-calm-hat-b5ikjjbs.c-7.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
    normalized = normalize_database_url(raw_url)

    engine = create_async_engine(normalized)
    url_obj = make_url(normalized)
    _, kwargs = engine.dialect.create_connect_args(url_obj)

    # 1. Critical regressions check: neither channel_binding nor sslmode are in kwargs
    assert "channel_binding" not in kwargs, "channel_binding must not be passed to asyncpg.connect"
    assert "sslmode" not in kwargs, "sslmode must not be passed to asyncpg.connect"
    assert kwargs.get("ssl") == "require", "SSL must remain enabled with ssl='require'"

    # 2. Check that all kwargs are accepted by asyncpg.connect or handled by dialect
    asyncpg_params = inspect.signature(asyncpg.connect).parameters
    dialect_managed_keys = {"prepared_statement_cache_size", "prepared_statement_name_func", "async_creator_fn"}
    for k in kwargs:
        assert k in asyncpg_params or k in dialect_managed_keys, f"Unexpected kwarg for asyncpg: {k}"


def test_normalize_database_url_non_postgres():
    """
    Verifies that SQLite and non-query postgres URLs are not corrupted.
    """
    sqlite_url = "sqlite+aiosqlite:///:memory:"
    assert normalize_database_url(sqlite_url) == sqlite_url

    local_pg = "postgresql+asyncpg://kushl@localhost:5432/kushalchat"
    assert normalize_database_url(local_pg) == local_pg
