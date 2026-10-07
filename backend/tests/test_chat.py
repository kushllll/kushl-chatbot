import json
from unittest.mock import patch
import pytest
from httpx import AsyncClient


async def mock_stream_tokens(*args, **kwargs):
    yield "Hello"
    yield " world"
    yield "!"


@pytest.mark.asyncio
async def test_chat_streaming_and_persistence(client: AsyncClient, auth_header_user1: dict):
    with patch(
        "app.api.chat.openrouter_service.stream_chat_completion",
        side_effect=mock_stream_tokens
    ):
        # 1. Send chat message without conversation_id (should auto-create)
        res = await client.post(
            "/api/chat",
            headers=auth_header_user1,
            json={"message": "Can you explain recursion?"}
        )
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]

        # Parse SSE stream
        chunks = []
        done_payload = None
        for line in res.text.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                data = json.loads(line[6:])
                if "chunk" in data:
                    chunks.append(data["chunk"])
                if data.get("done"):
                    done_payload = data

        # Check stream content
        assert "".join(chunks) == "Hello world!"
        assert done_payload is not None
        assert done_payload["done"] is True
        conv_id = done_payload["conversation_id"]

        # 2. Verify messages are persisted in conversation
        conv_res = await client.get(f"/api/conversations/{conv_id}", headers=auth_header_user1)
        assert conv_res.status_code == 200
        conv_data = conv_res.json()
        messages = conv_data["messages"]
        assert len(messages) == 2
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "Can you explain recursion?"
        assert messages[1]["role"] == "assistant"
        assert messages[1]["content"] == "Hello world!"


@pytest.mark.asyncio
async def test_chat_empty_message_validation(client: AsyncClient, auth_header_user1: dict):
    res = await client.post(
        "/api/chat",
        headers=auth_header_user1,
        json={"message": "   "}
    )
    assert res.status_code == 400
    assert "Message content cannot be empty" in res.json()["detail"]


@pytest.mark.asyncio
async def test_chat_cross_user_isolation(client: AsyncClient, auth_header_user1: dict, auth_header_user2: dict):
    # User 1 creates conversation
    create_res = await client.post(
        "/api/conversations",
        headers=auth_header_user1,
        json={"title": "Private User 1 Thread"}
    )
    assert create_res.status_code == 201
    conv_id = create_res.json()["id"]

    # User 2 tries to post chat message into User 1's conversation
    attack_res = await client.post(
        "/api/chat",
        headers=auth_header_user2,
        json={"message": "Injected message", "conversation_id": conv_id}
    )
    # Must be rejected with 404 (strictly isolated)
    assert attack_res.status_code == 404
    assert "Conversation not found" in attack_res.json()["detail"]


@pytest.mark.asyncio
async def test_get_chat_models(client: AsyncClient):
    res = await client.get("/api/chat/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "default" in data
    assert len(data["models"]) >= 4
    model_ids = [m["id"] for m in data["models"]]
    assert "nvidia/nemotron-3-ultra-550b-a55b:free" in model_ids
    assert "nvidia/nemotron-3.5-lightning:free" in model_ids
    assert "thinkingmachines/inkling-small:free" in model_ids
    assert "google/gemma-4-31b-it:free" in model_ids
    # Verify metadata fields
    for m in data["models"]:
        assert "name" in m
        assert "tagline" in m
        assert "description" in m


@pytest.mark.asyncio
async def test_guest_chat_streaming_success(client: AsyncClient):
    with patch(
        "app.api.chat.openrouter_service.stream_chat_completion",
        side_effect=mock_stream_tokens
    ) as mock_complete:
        res = await client.post(
            "/api/chat/guest",
            json={
                "message": "Hello from guest",
                "model": "nvidia/nemotron-3.5-lightning:free",
                "history": [
                    {"role": "user", "content": "Prior question"},
                    {"role": "assistant", "content": "Prior reply"}
                ]
            }
        )
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]

        chunks = []
        done_payload = None
        for line in res.text.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                data = json.loads(line[6:])
                if "chunk" in data:
                    chunks.append(data["chunk"])
                if data.get("done"):
                    done_payload = data

        assert "".join(chunks) == "Hello world!"
        assert done_payload is not None
        assert done_payload["done"] is True
        assert done_payload["guest"] is True

        # Verify model was passed
        mock_complete.assert_called_once()
        call_kwargs = mock_complete.call_args.kwargs
        assert call_kwargs.get("model") == "nvidia/nemotron-3.5-lightning:free"


@pytest.mark.asyncio
async def test_guest_chat_model_alias_resolution(client: AsyncClient):
    with patch(
        "app.api.chat.openrouter_service.stream_chat_completion",
        side_effect=mock_stream_tokens
    ) as mock_complete:
        res = await client.post(
            "/api/chat/guest",
            json={
                "message": "Test alias",
                "model": "google/gemma-4-31b:free"
            }
        )
        assert res.status_code == 200
        call_kwargs = mock_complete.call_args.kwargs
        # Must resolve to verified it:free target
        assert call_kwargs.get("model") == "google/gemma-4-31b-it:free"


@pytest.mark.asyncio
async def test_guest_chat_invalid_model_rejected(client: AsyncClient):
    res = await client.post(
        "/api/chat/guest",
        json={
            "message": "Hello",
            "model": "unauthorized/custom-evil-model:1337"
        }
    )
    assert res.status_code == 400
    assert "is not supported" in res.json()["detail"]


@pytest.mark.asyncio
async def test_guest_chat_message_validation(client: AsyncClient):
    # Empty message
    res_empty = await client.post(
        "/api/chat/guest",
        json={"message": "   "}
    )
    assert res_empty.status_code == 400
    assert "Message content cannot be empty" in res_empty.json()["detail"]

    # Exceeding max length (2000 chars)
    res_long = await client.post(
        "/api/chat/guest",
        json={"message": "a" * 2001}
    )
    assert res_long.status_code == 422


@pytest.mark.asyncio
async def test_guest_chat_rate_limiting(client: AsyncClient):
    from app.api.chat import _guest_request_timestamps
    _guest_request_timestamps.clear()

    with patch(
        "app.api.chat.openrouter_service.stream_chat_completion",
        side_effect=mock_stream_tokens
    ):
        headers = {"x-forwarded-for": "198.51.100.42"}
        # Send 20 requests
        for _ in range(20):
            res = await client.post(
                "/api/chat/guest",
                headers=headers,
                json={"message": "ping"}
            )
            assert res.status_code == 200

        # 21st request must trigger 429
        rate_res = await client.post(
            "/api/chat/guest",
            headers=headers,
            json={"message": "ping"}
        )
        assert rate_res.status_code == 429
        assert "Guest rate limit exceeded" in rate_res.json()["detail"]


@pytest.mark.asyncio
async def test_chat_authenticated_with_custom_model(client: AsyncClient, auth_header_user1: dict):
    with patch(
        "app.api.chat.openrouter_service.stream_chat_completion",
        side_effect=mock_stream_tokens
    ) as mock_complete:
        res = await client.post(
            "/api/chat",
            headers=auth_header_user1,
            json={
                "message": "Explain quantum physics",
                "model": "thinkingmachines/inkling-small:free"
            }
        )
        assert res.status_code == 200
        mock_complete.assert_called_once()
        call_kwargs = mock_complete.call_args.kwargs
        assert call_kwargs.get("model") == "thinkingmachines/inkling-small:free"


@pytest.mark.asyncio
async def test_inkling_alias_resolution(client: AsyncClient):
    with patch(
        "app.api.chat.openrouter_service.stream_chat_completion",
        side_effect=mock_stream_tokens
    ) as mock_complete:
        res = await client.post(
            "/api/chat/guest",
            json={
                "message": "Test inkling alias",
                "model": "thinkingmachines/inkling:free"
            }
        )
        assert res.status_code == 200
        call_kwargs = mock_complete.call_args.kwargs
        # Must resolve to verified inkling-small:free target
        assert call_kwargs.get("model") == "thinkingmachines/inkling-small:free"
