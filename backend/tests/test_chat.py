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
