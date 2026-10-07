import time
import pytest
from cryptography.hazmat.primitives.asymmetric import ed25519
from httpx import AsyncClient
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


class MockSigningKey:
    def __init__(self, key):
        self.key = key


class MockJWKClient:
    def __init__(self, public_key):
        self.public_key = public_key

    def get_signing_key_from_jwt(self, token):
        return MockSigningKey(self.public_key)


@pytest.fixture
def ed25519_keypair():
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key


@pytest.mark.asyncio
async def test_unauthorized_without_token(client: AsyncClient):
    response = await client.get("/api/conversations")
    assert response.status_code == 401
    assert "Missing Authorization header" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unauthorized_with_malformed_token(client: AsyncClient):
    response = await client.get("/api/conversations", headers={"Authorization": "Bearer invalid-token"})
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"]


@pytest.mark.asyncio
async def test_valid_neon_auth_eddsa_jwt(client: AsyncClient, db_session: AsyncSession, ed25519_keypair, monkeypatch):
    """
    Focused Test 1 & 5: Valid Neon Auth EdDSA JWT signature verification and user auto-provisioning.
    """
    priv, pub = ed25519_keypair
    monkeypatch.setattr("app.core.security.get_jwks_client", lambda: MockJWKClient(pub))

    claims = {
        "sub": "neon_test_sub_101",
        "email": "neon_test@example.com",
        "name": "Neon Test User",
        "picture": "https://example.com/avatar.png",
        "exp": time.time() + 300,
        "iat": time.time(),
    }
    token = jwt.encode(claims, priv, algorithm="EdDSA", headers={"kid": "test-kid"})

    # Ensure user does not exist yet
    res = await db_session.execute(select(User).where(User.auth_id == "neon_test_sub_101"))
    assert res.scalar_one_or_none() is None

    # First authenticated request
    response = await client.get("/api/conversations", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == []

    # Verify user was automatically provisioned in database
    res = await db_session.execute(select(User).where(User.auth_id == "neon_test_sub_101"))
    user = res.scalar_one_or_none()
    assert user is not None
    assert user.auth_id == "neon_test_sub_101"
    assert user.email == "neon_test@example.com"
    assert user.display_name == "Neon Test User"
    assert user.photo_url == "https://example.com/avatar.png"


@pytest.mark.asyncio
async def test_invalid_signature_rejected(client: AsyncClient, ed25519_keypair, monkeypatch):
    """
    Focused Test 2: Invalid EdDSA cryptographic signature is rejected with HTTP 401.
    """
    _, pub = ed25519_keypair
    monkeypatch.setattr("app.core.security.get_jwks_client", lambda: MockJWKClient(pub))

    # Sign with a different, unauthorized private key
    attacker_priv = ed25519.Ed25519PrivateKey.generate()
    claims = {
        "sub": "attacker_user",
        "email": "attacker@example.com",
        "exp": time.time() + 300,
    }
    tampered_token = jwt.encode(claims, attacker_priv, algorithm="EdDSA")

    response = await client.get("/api/conversations", headers={"Authorization": f"Bearer {tampered_token}"})
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"]


@pytest.mark.asyncio
async def test_expired_token_rejected(client: AsyncClient, ed25519_keypair, monkeypatch):
    """
    Focused Test 3: Expired Neon Auth JWT is rejected with HTTP 401.
    """
    priv, pub = ed25519_keypair
    monkeypatch.setattr("app.core.security.get_jwks_client", lambda: MockJWKClient(pub))

    expired_claims = {
        "sub": "expired_user",
        "email": "expired@example.com",
        "exp": time.time() - 60,  # Expired 60s ago
    }
    expired_token = jwt.encode(expired_claims, priv, algorithm="EdDSA")

    response = await client.get("/api/conversations", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    assert "Authentication token has expired" in response.json()["detail"]


@pytest.mark.asyncio
async def test_missing_required_identity_claim(client: AsyncClient, ed25519_keypair, monkeypatch):
    """
    Focused Test 4: Token missing subject identity claim is rejected with HTTP 401.
    """
    priv, pub = ed25519_keypair
    monkeypatch.setattr("app.core.security.get_jwks_client", lambda: MockJWKClient(pub))

    no_sub_claims = {
        "email": "no_sub@example.com",
        "name": "No Sub",
        "exp": time.time() + 300,
    }
    token = jwt.encode(no_sub_claims, priv, algorithm="EdDSA")

    response = await client.get("/api/conversations", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Invalid token: missing subject identity" in response.json()["detail"]


@pytest.mark.asyncio
async def test_user_auto_provisioning_with_mock_token(client: AsyncClient, db_session: AsyncSession, auth_header_user1: dict):
    """
    Focused Test 5: Deterministic dev token auto-provisions user.
    """
    # Verify user does not exist yet
    res = await db_session.execute(select(User).where(User.auth_id == "user_1"))
    assert res.scalar_one_or_none() is None

    # First authenticated request
    response = await client.get("/api/conversations", headers=auth_header_user1)
    assert response.status_code == 200
    assert response.json() == []

    # Verify user was automatically provisioned in database
    res = await db_session.execute(select(User).where(User.auth_id == "user_1"))
    user = res.scalar_one_or_none()
    assert user is not None
    assert user.auth_id == "user_1"
    assert user.email == "user1@example.com"


@pytest.mark.asyncio
async def test_mock_token_rejected_in_production(client: AsyncClient, monkeypatch):
    """
    Focused Test 6: Mock tokens are strictly rejected when ENVIRONMENT=production.
    """
    from app.core.config import settings
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = await client.get(
        "/api/conversations",
        headers={"Authorization": "Bearer mock-test-token:attacker:attacker@bad.com"}
    )
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"]


@pytest.mark.asyncio
async def test_existing_authorization_ownership_behavior(
    client: AsyncClient,
    auth_header_user1: dict,
    auth_header_user2: dict
):
    """
    Focused Test 7: Ownership isolation between distinct authenticated users.
    """
    # User 1 creates conversation
    create_res = await client.post(
        "/api/conversations",
        headers=auth_header_user1,
        json={"title": "User 1 Private Chat"}
    )
    assert create_res.status_code == 201
    conv_id = create_res.json()["id"]

    # User 1 can view it
    get_res = await client.get(f"/api/conversations/{conv_id}", headers=auth_header_user1)
    assert get_res.status_code == 200

    # User 2 cannot view it (returns 404 Not Found)
    isolated_res = await client.get(f"/api/conversations/{conv_id}", headers=auth_header_user2)
    assert isolated_res.status_code == 404
