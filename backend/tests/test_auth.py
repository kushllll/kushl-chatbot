import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


@pytest.mark.asyncio
async def test_unauthorized_without_token(client: AsyncClient):
    response = await client.get("/api/conversations")
    assert response.status_code == 401
    assert "Missing Authorization header" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unauthorized_with_malformed_token(client: AsyncClient):
    response = await client.get("/api/conversations", headers={"Authorization": "Bearer invalid-token"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_user_auto_provisioning(client: AsyncClient, db_session: AsyncSession, auth_header_user1: dict):
    # Verify user does not exist yet
    res = await db_session.execute(select(User).where(User.firebase_uid == "user_1"))
    assert res.scalar_one_or_none() is None

    # First authenticated request
    response = await client.get("/api/conversations", headers=auth_header_user1)
    assert response.status_code == 200
    assert response.json() == []

    # Verify user was automatically provisioned in database
    res = await db_session.execute(select(User).where(User.firebase_uid == "user_1"))
    user = res.scalar_one_or_none()
    assert user is not None
    assert user.firebase_uid == "user_1"
    assert user.email == "user1@example.com"


@pytest.mark.asyncio
async def test_mock_token_rejected_in_production(client: AsyncClient, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = await client.get(
        "/api/conversations",
        headers={"Authorization": "Bearer mock-test-token:attacker:attacker@bad.com"}
    )
    # Must be rejected in production
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"]
