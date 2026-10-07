import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_conversation_lifecycle(client: AsyncClient, auth_header_user1: dict):
    # 1. Create conversation
    create_res = await client.post(
        "/api/conversations",
        headers=auth_header_user1,
        json={"title": "Design Discussion"}
    )
    assert create_res.status_code == 201
    conv_data = create_res.json()
    conv_id = conv_data["id"]
    assert conv_data["title"] == "Design Discussion"
    assert conv_data["message_count"] == 0

    # 2. List conversations
    list_res = await client.get("/api/conversations", headers=auth_header_user1)
    assert list_res.status_code == 200
    convs = list_res.json()
    assert len(convs) == 1
    assert convs[0]["id"] == conv_id

    # 3. Get detail
    detail_res = await client.get(f"/api/conversations/{conv_id}", headers=auth_header_user1)
    assert detail_res.status_code == 200
    assert detail_res.json()["messages"] == []

    # 4. Update title
    update_res = await client.patch(
        f"/api/conversations/{conv_id}",
        headers=auth_header_user1,
        json={"title": "Updated Architecture"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Architecture"

    # 5. Delete conversation
    del_res = await client.delete(f"/api/conversations/{conv_id}", headers=auth_header_user1)
    assert del_res.status_code == 204

    # 6. Verify 404 after deletion
    get_after_del = await client.get(f"/api/conversations/{conv_id}", headers=auth_header_user1)
    assert get_after_del.status_code == 404


@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient, auth_header_user1: dict, auth_header_user2: dict):
    # User 1 creates conversation
    create_res = await client.post(
        "/api/conversations",
        headers=auth_header_user1,
        json={"title": "User 1 Secret Chat"}
    )
    assert create_res.status_code == 201
    conv_id = create_res.json()["id"]

    # User 2 lists conversations (should not see User 1's conversation)
    user2_list = await client.get("/api/conversations", headers=auth_header_user2)
    assert user2_list.status_code == 200
    assert all(c["id"] != conv_id for c in user2_list.json())

    # User 2 attempts to get User 1's conversation directly (must return 404)
    user2_get = await client.get(f"/api/conversations/{conv_id}", headers=auth_header_user2)
    assert user2_get.status_code == 404

    # User 2 attempts to delete User 1's conversation (must return 404)
    user2_del = await client.delete(f"/api/conversations/{conv_id}", headers=auth_header_user2)
    assert user2_del.status_code == 404
