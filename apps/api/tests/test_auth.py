import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.lib.auth import CurrentUserInfo, _ensure_user_exists


@pytest.mark.asyncio
async def test_ensure_user_exists_rejects_non_uuid_user_id() -> None:
    with pytest.raises(HTTPException) as exc_info:
        await _ensure_user_exists(CurrentUserInfo(id="not-a-uuid"))

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid token"


def test_me_returns_401_for_supabase_jwt_with_non_uuid_sub(client: TestClient) -> None:
    invalid_supabase_jwt = (
        "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0."
        "eyJzdWIiOiJub3QtYS11dWlkIiwiZXhwIjo0MTAyNDQ0ODAwfQ."
        "sig"
    )

    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {invalid_supabase_jwt}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"
