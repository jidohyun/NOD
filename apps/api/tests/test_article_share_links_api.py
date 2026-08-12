import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import cast
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import UniqueConstraint
from sqlalchemy.ext.asyncio import AsyncSession

from src.articles import service
from src.articles.model import (
    Article,
    ArticleShareComment,
    ArticleShareCommentEmpathy,
    ArticleShareEmpathy,
    ArticleShareLink,
    ArticleSummary,
)
from src.articles.schemas import (
    ArticleShareLinkResponse,
    SharedArticleSharerResponse,
    SharedArticleSummaryResponse,
)
from src.lib.auth import CurrentUserInfo
from src.users.model import User


def test_share_link_requires_article_and_owner() -> None:
    article_id_column = ArticleShareLink.__table__.c.article_id
    owner_user_id_column = ArticleShareLink.__table__.c.owner_user_id

    assert article_id_column.nullable is False
    assert owner_user_id_column.nullable is False

    article_targets = {fk.target_fullname for fk in article_id_column.foreign_keys}
    owner_targets = {fk.target_fullname for fk in owner_user_id_column.foreign_keys}

    assert "articles.id" in article_targets
    assert "users.id" in owner_targets


def test_only_one_active_share_link_per_article() -> None:
    article_id_column = ArticleShareLink.__table__.c.article_id

    assert article_id_column.unique is True


def test_share_empathy_requires_share_link_and_user_unique_pair() -> None:
    share_link_id_column = ArticleShareEmpathy.__table__.c.share_link_id
    user_id_column = ArticleShareEmpathy.__table__.c.user_id

    assert share_link_id_column.nullable is False
    assert user_id_column.nullable is False

    share_targets = {fk.target_fullname for fk in share_link_id_column.foreign_keys}
    user_targets = {fk.target_fullname for fk in user_id_column.foreign_keys}

    assert "article_share_links.id" in share_targets
    assert "users.id" in user_targets

    table_args = ArticleShareEmpathy.__table_args__
    assert isinstance(table_args, tuple)
    constraint_columns = {
        tuple(constraint.columns.keys())
        for constraint in table_args
        if isinstance(constraint, UniqueConstraint)
        and constraint.name == "uq_article_share_empathies_share_link_user"
    }
    assert ("share_link_id", "user_id") in constraint_columns


def test_share_comment_requires_author_user_and_supports_parent_comment() -> None:
    author_user_id_column = ArticleShareComment.__table__.c.author_user_id
    parent_comment_id_column = ArticleShareComment.__table__.c.parent_comment_id

    assert author_user_id_column.nullable is False
    assert parent_comment_id_column.nullable is True

    author_targets = {fk.target_fullname for fk in author_user_id_column.foreign_keys}
    parent_targets = {
        fk.target_fullname for fk in parent_comment_id_column.foreign_keys
    }

    assert "users.id" in author_targets
    assert "article_share_comments.id" in parent_targets


def test_share_comment_empathy_requires_comment_and_user_unique_pair() -> None:
    comment_id_column = ArticleShareCommentEmpathy.__table__.c.comment_id
    user_id_column = ArticleShareCommentEmpathy.__table__.c.user_id

    assert comment_id_column.nullable is False
    assert user_id_column.nullable is False

    comment_targets = {fk.target_fullname for fk in comment_id_column.foreign_keys}
    user_targets = {fk.target_fullname for fk in user_id_column.foreign_keys}

    assert "article_share_comments.id" in comment_targets
    assert "users.id" in user_targets

    table_args = ArticleShareCommentEmpathy.__table_args__
    assert isinstance(table_args, tuple)
    constraint_columns = {
        tuple(constraint.columns.keys())
        for constraint in table_args
        if isinstance(constraint, UniqueConstraint)
        and constraint.name == "uq_article_share_comment_empathies_comment_user"
    }
    assert ("comment_id", "user_id") in constraint_columns


class _FakeResult:
    def __init__(self, value: object) -> None:
        self._value = value

    def scalar_one_or_none(self) -> object:
        return self._value

    def scalar_one(self) -> object:
        return self._value


class _FakeDB:
    def __init__(self, execute_results: list[object]) -> None:
        self._execute_results = execute_results
        self.added: list[object] = []

    async def execute(self, _query: object) -> _FakeResult:
        value = self._execute_results.pop(0) if self._execute_results else None
        return _FakeResult(value)

    def add(self, value: object) -> None:
        self.added.append(value)

    async def flush(self) -> None:
        return None


class _FakeScalarResultSequence:
    def __init__(self, values: list[object]) -> None:
        self._values = values

    def all(self) -> list[object]:
        return list(self._values)


class _FakeResultSequence:
    def __init__(self, values: list[object]) -> None:
        self._values = values

    def scalars(self) -> _FakeScalarResultSequence:
        return _FakeScalarResultSequence(self._values)


class _FakeDBSequence:
    def __init__(self, execute_results: list[list[object]]) -> None:
        self._execute_results = execute_results

    async def execute(self, _query: object) -> _FakeResultSequence:
        value = self._execute_results.pop(0) if self._execute_results else []
        return _FakeResultSequence(value)


@pytest.mark.asyncio
async def test_create_or_regenerate_share_link_returns_public_url_parts(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    article_id = uuid.uuid4()
    owner_user_id = uuid.uuid4()
    article = Article(
        id=article_id,
        user_id=owner_user_id,
        title="Mastering VI and Vim editor in Linux",
        content="content",
        source="web",
        status="analyzed",
    )
    db = _FakeDB(execute_results=[article, None])

    monkeypatch.setattr(
        "src.articles.service.secrets.token_urlsafe", lambda _n: "plain-token"
    )
    monkeypatch.setattr(
        service,
        "_utc_now",
        lambda: datetime(2026, 3, 21, 12, 0, tzinfo=UTC),
    )

    response = await service.create_or_regenerate_share_link(
        db=cast(
            AsyncSession,
            cast(
                object,
                SimpleNamespace(execute=db.execute, add=db.add, flush=db.flush),
            ),
        ),
        article_id=article_id,
        owner_user_id=owner_user_id,
        ttl=timedelta(hours=24),
    )

    assert response.share_id
    assert response.share_url.startswith(f"/share/{response.share_id}?token=")
    assert response.share_url.endswith("plain-token")
    assert response.share_slug == "mastering-vi-and-vim-editor-in-linux"
    assert response.canonical_share_url == (
        f"/share/{response.share_slug}-{response.share_id}?token=plain-token"
    )
    assert response.expires_at == datetime(2026, 3, 22, 12, 0, tzinfo=UTC)


@pytest.mark.asyncio
async def test_create_or_regenerate_share_link_records_slug_history_on_title_change(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    article_id = uuid.uuid4()
    owner_user_id = uuid.uuid4()
    share_id = uuid.uuid4()
    existing = ArticleShareLink(
        id=share_id,
        article_id=article_id,
        owner_user_id=owner_user_id,
        token_hash=service._hash_share_token("old-token"),
        share_slug="old-title",
        share_sid=share_id.hex[:12],
        revoked_at=None,
        expires_at=None,
    )
    article = Article(
        id=article_id,
        user_id=owner_user_id,
        title="New Better Title",
        content="content",
        source="web",
        status="analyzed",
    )
    db = _FakeDB(execute_results=[article, existing])

    monkeypatch.setattr(
        "src.articles.service.secrets.token_urlsafe", lambda _n: "next-token"
    )

    response = await service.create_or_regenerate_share_link(
        db=cast(
            AsyncSession,
            cast(
                object,
                SimpleNamespace(execute=db.execute, add=db.add, flush=db.flush),
            ),
        ),
        article_id=article_id,
        owner_user_id=owner_user_id,
        ttl=None,
    )

    assert response.share_slug == "new-better-title"
    assert any(
        isinstance(value, service.ArticleShareSlugHistory) and value.slug == "old-title"
        for value in db.added
    )


@pytest.mark.asyncio
async def test_get_shared_article_returns_allowlisted_summary_fields_only(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    article_id = uuid.uuid4()
    owner_user_id = uuid.uuid4()
    share_id = uuid.uuid4()
    now = datetime(2026, 3, 21, 12, 0, tzinfo=UTC)
    token = f"tok-{uuid.uuid4()}"

    summary = ArticleSummary(
        article_id=article_id,
        summary="short summary",
        markdown_note="# Full Summary\n\nThis is the complete summary.",
        concepts=["python"],
        key_points=["point"],
        reading_time_minutes=4,
        language="en",
        content_type="general_news",
        type_metadata={"source": "web"},
        ai_provider="gemini",
        ai_model="gemini-2.0-flash",
    )
    article = Article(
        user_id=owner_user_id,
        url="https://example.com",
        title="Example",
        content="private full content",
        source="web",
        status="analyzed",
    )
    article.id = article_id
    article.created_at = now
    article.summary = summary
    summary.article = article

    share_link = ArticleShareLink(
        article_id=article_id,
        owner_user_id=owner_user_id,
        token_hash=service._hash_share_token(token),
        share_slug="example",
        share_sid=share_id.hex[:12],
        expires_at=now + timedelta(hours=1),
        revoked_at=None,
    )
    owner_user = User(
        id=owner_user_id,
        email="owner@example.com",
        name="NOD Owner",
        image="https://example.com/avatar.png",
    )
    share_link.id = share_id
    share_link.article = article
    share_link.owner_user = owner_user

    db = _FakeDB(execute_results=[share_link])
    monkeypatch.setattr(service, "_utc_now", lambda: now)

    result = await service.get_shared_article_by_token(
        db=cast(AsyncSession, cast(object, SimpleNamespace(execute=db.execute))),
        share_id=share_id,
        token=token,
    )

    assert result is not None
    payload = result.model_dump()
    assert "content" not in payload
    assert "user_id" not in payload
    assert payload["share_id"] == share_id
    assert payload["share_slug"] == "example"
    assert payload["share_sid"] == share_id.hex[:12]
    assert payload["canonical_share_path"] == f"/share/example-{share_id}"
    assert payload["title"] == "Example"
    assert payload["summary"] == "short summary"
    assert payload["markdown_note"] == "# Full Summary\n\nThis is the complete summary."
    assert payload["sharer"] == {
        "name": "NOD Owner",
        "image": "https://example.com/avatar.png",
    }
    assert payload["url_mode"] == "default"
    assert payload["custom_url"] is None
    assert payload["og_mode"] == "default"
    assert payload["og_image_url"] is None


@pytest.mark.asyncio
async def test_revoked_or_expired_share_link_returns_not_found_semantics(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    article_id = uuid.uuid4()
    owner_user_id = uuid.uuid4()
    share_id = uuid.uuid4()
    now = datetime(2026, 3, 21, 12, 0, tzinfo=UTC)
    expired_token = f"tok-{uuid.uuid4()}"
    revoked_token = f"tok-{uuid.uuid4()}"

    expired = ArticleShareLink(
        article_id=article_id,
        owner_user_id=owner_user_id,
        token_hash=service._hash_share_token(expired_token),
        share_slug="shared-article",
        share_sid=share_id.hex[:12],
        expires_at=now - timedelta(minutes=1),
        revoked_at=None,
    )
    expired.id = share_id

    revoked = ArticleShareLink(
        article_id=article_id,
        owner_user_id=owner_user_id,
        token_hash=service._hash_share_token(revoked_token),
        share_slug="shared-article",
        share_sid=share_id.hex[:12],
        expires_at=now + timedelta(minutes=30),
        revoked_at=now,
    )
    revoked.id = share_id

    monkeypatch.setattr(service, "_utc_now", lambda: now)

    expired_db = _FakeDB(execute_results=[expired])
    revoked_db = _FakeDB(execute_results=[revoked])

    expired_result = await service.get_shared_article_by_token(
        db=cast(
            AsyncSession,
            cast(object, SimpleNamespace(execute=expired_db.execute)),
        ),
        share_id=share_id,
        token=expired_token,
    )
    revoked_result = await service.get_shared_article_by_token(
        db=cast(
            AsyncSession,
            cast(object, SimpleNamespace(execute=revoked_db.execute)),
        ),
        share_id=share_id,
        token=revoked_token,
    )

    assert expired_result is None
    assert revoked_result is None


def _make_test_client_with_user(user_id: str) -> TestClient:
    from src.lib.database import get_db
    from src.lib.dependencies import get_current_user
    from src.main import app

    async def override_user() -> CurrentUserInfo:
        return CurrentUserInfo(id=user_id)

    async def override_db() -> AsyncIterator[AsyncMock]:
        yield AsyncMock()

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_db] = override_db
    return TestClient(app)


def test_post_share_link_returns_200_and_share_payload() -> None:
    user_id = str(uuid.uuid4())
    article_id = str(uuid.uuid4())
    client = _make_test_client_with_user(user_id)

    expected = ArticleShareLinkResponse(
        share_id=uuid.uuid4(),
        share_url="/share/mock?token=abc",
        share_slug="shared-article",
        canonical_share_url="/share/shared-article-63a34f8a-b928-4ffb-8238-32dd28de4f52?token=abc",
        expires_at=datetime(2026, 3, 22, 12, 0, tzinfo=UTC),
    )

    with patch.object(
        service,
        "create_or_regenerate_share_link",
        new=AsyncMock(return_value=expected),
    ):
        response = client.post(f"/api/articles/{article_id}/share-link")

    assert response.status_code == 200
    payload = response.json()
    assert payload["share_id"] == str(expected.share_id)
    assert payload["share_url"] == expected.share_url
    assert payload["share_slug"] == expected.share_slug
    assert payload["canonical_share_url"] == expected.canonical_share_url


def test_delete_share_link_returns_204() -> None:
    user_id = str(uuid.uuid4())
    article_id = str(uuid.uuid4())
    client = _make_test_client_with_user(user_id)

    with patch.object(
        service,
        "revoke_share_link",
        new=AsyncMock(return_value=True),
    ):
        response = client.delete(f"/api/articles/{article_id}/share-link")

    assert response.status_code == 204


def test_get_shared_article_returns_200_with_public_payload() -> None:
    share_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"

    shared = SharedArticleSummaryResponse(
        share_id=uuid.UUID(share_id),
        share_slug="shared-article",
        share_sid="abc123def456",
        canonical_share_path=f"/share/shared-article-{share_id}",
        article_id=uuid.uuid4(),
        title="Shared article",
        source="web",
        url="https://example.com",
        created_at=datetime(2026, 3, 21, 12, 0, tzinfo=UTC),
        summary="public summary",
        markdown_note="# Public Full Summary\n\nLong-form markdown note",
        key_points=["point-1"],
        concepts=["concept-1"],
        reading_time_minutes=3,
        language="en",
        content_type="general_news",
        type_metadata={},
        empathy_count=5,
        viewer_has_empathy=False,
        sharer=SharedArticleSharerResponse(
            name="NOD Owner",
            image="https://example.com/avatar.png",
        ),
    )

    from src.main import app

    client = TestClient(app)
    with patch.object(
        service,
        "get_shared_article_by_token",
        new=AsyncMock(return_value=shared),
    ):
        response = client.get(f"/api/articles/share/{share_id}?token={token}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Shared article"
    assert payload["summary"] == "public summary"
    assert (
        payload["markdown_note"] == "# Public Full Summary\n\nLong-form markdown note"
    )
    assert payload["empathy_count"] == 5
    assert payload["viewer_has_empathy"] is False
    assert payload["sharer"] == {
        "name": "NOD Owner",
        "image": "https://example.com/avatar.png",
    }


def test_get_shared_article_by_slug_returns_200_with_public_payload() -> None:
    share_slug = "shared-article-63a34f8a-b928-4ffb-8238-32dd28de4f52"
    token = f"tok-{uuid.uuid4()}"

    shared = SharedArticleSummaryResponse(
        share_id=uuid.uuid4(),
        share_slug="shared-article",
        share_sid="abc123def456",
        canonical_share_path="/share/shared-article-63a34f8a-b928-4ffb-8238-32dd28de4f52",
        article_id=uuid.uuid4(),
        title="Shared article",
        source="web",
        url="https://example.com",
        created_at=datetime(2026, 3, 21, 12, 0, tzinfo=UTC),
        summary="public summary",
        markdown_note="# Public Full Summary\n\nLong-form markdown note",
        key_points=["point-1"],
        concepts=["concept-1"],
        reading_time_minutes=3,
        language="en",
        content_type="general_news",
        type_metadata={},
        empathy_count=5,
        viewer_has_empathy=False,
        sharer=SharedArticleSharerResponse(
            name="NOD Owner",
            image="https://example.com/avatar.png",
        ),
    )

    from src.main import app

    client = TestClient(app)
    with patch.object(
        service,
        "get_shared_article_by_slug",
        new=AsyncMock(return_value=shared),
    ):
        response = client.get(f"/api/articles/share/by-slug/{share_slug}?token={token}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Shared article"
    assert payload["summary"] == "public summary"


@pytest.mark.asyncio
async def test_get_shared_article_by_slug_supports_slug_plus_uuid_suffix() -> None:
    share_id = uuid.uuid4()
    share_slug_input = f"next-js-hydration-{share_id}"
    token = f"tok-{uuid.uuid4()}"

    expected = SharedArticleSummaryResponse(
        share_id=share_id,
        share_slug="next-js-hydration",
        share_sid=share_id.hex[:12],
        canonical_share_path=f"/share/next-js-hydration-{share_id}",
        article_id=uuid.uuid4(),
        title="Next.js hydration",
        source="web",
        url="https://example.com",
        created_at=datetime(2026, 3, 21, 12, 0, tzinfo=UTC),
        summary="public summary",
        markdown_note=None,
        key_points=["point-1"],
        concepts=["concept-1"],
        reading_time_minutes=3,
        language="en",
        content_type="general_news",
        type_metadata={},
        empathy_count=0,
        viewer_has_empathy=False,
        sharer=SharedArticleSharerResponse(name="Owner", image=None),
    )

    with patch.object(
        service,
        "get_shared_article_by_token",
        new=AsyncMock(return_value=expected),
    ) as get_by_token:
        result = await service.get_shared_article_by_slug(
            db=cast(AsyncSession, cast(object, SimpleNamespace(execute=AsyncMock()))),
            share_slug=share_slug_input,
            token=token,
            viewer_user_id=None,
        )

    assert result is not None
    assert result.share_id == share_id
    get_by_token.assert_awaited_once()
    await_args = get_by_token.await_args
    assert await_args is not None
    assert await_args.kwargs is not None
    kwargs = await_args.kwargs
    assert kwargs["share_id"] == share_id
    assert kwargs["token"] == token
    assert kwargs["viewer_user_id"] is None


@pytest.mark.asyncio
async def test_get_shared_article_by_slug_supports_plain_slug_lookup() -> None:
    share_id = uuid.uuid4()
    token = f"tok-{uuid.uuid4()}"

    db = _FakeDBSequence(execute_results=[[share_id]])

    expected = SharedArticleSummaryResponse(
        share_id=share_id,
        share_slug="next-js-hydration",
        share_sid=share_id.hex[:12],
        canonical_share_path=f"/share/next-js-hydration-{share_id}",
        article_id=uuid.uuid4(),
        title="Next.js hydration",
        source="web",
        url="https://example.com",
        created_at=datetime(2026, 3, 21, 12, 0, tzinfo=UTC),
        summary="public summary",
        markdown_note=None,
        key_points=["point-1"],
        concepts=["concept-1"],
        reading_time_minutes=3,
        language="en",
        content_type="general_news",
        type_metadata={},
        empathy_count=0,
        viewer_has_empathy=False,
        sharer=SharedArticleSharerResponse(name="Owner", image=None),
    )

    with patch.object(
        service,
        "get_shared_article_by_token",
        new=AsyncMock(return_value=expected),
    ) as get_by_token:
        result = await service.get_shared_article_by_slug(
            db=cast(AsyncSession, cast(object, SimpleNamespace(execute=db.execute))),
            share_slug="next-js-hydration",
            token=token,
            viewer_user_id=None,
        )

    assert result is not None
    assert result.share_id == share_id
    get_by_token.assert_awaited_once()


@pytest.mark.asyncio
async def test_build_shared_article_response_tolerates_invalid_viewer_id() -> None:
    from src.articles.model import Article, ArticleShareLink, ArticleSummary
    from src.users.model import User

    share_id = uuid.uuid4()
    owner_id = uuid.uuid4()
    article_id = uuid.uuid4()

    summary = ArticleSummary(
        article_id=article_id,
        summary="public summary",
        markdown_note=None,
        concepts=[],
        key_points=[],
        content_type="general_news",
        type_metadata={},
    )

    article = Article(
        id=article_id,
        user_id=owner_id,
        title="Shared article",
        source="web",
        summary=summary,
    )

    owner = User(id=owner_id, email="owner@example.com", name="Owner")

    token_hash_value = uuid.uuid4().hex
    share_link = ArticleShareLink(
        id=share_id,
        article_id=article_id,
        owner_user_id=owner_id,
        token_hash=token_hash_value,
        share_slug="shared-article",
        share_sid=share_id.hex[:12],
        created_at=datetime(2026, 3, 21, 12, 0, tzinfo=UTC),
        article=article,
        owner_user=owner,
    )

    db = AsyncMock()
    db.execute.return_value = _FakeResult(0)

    response = await service._build_shared_article_response(
        db=cast(AsyncSession, db),
        share_link=share_link,
        viewer_user_id="not-a-uuid",
    )

    assert response is not None
    assert response.share_id == share_id
    assert response.viewer_has_empathy is False


def test_get_shared_article_comments_returns_200_with_list() -> None:
    share_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"

    from src.main import app

    client = TestClient(app)
    with patch.object(
        service,
        "list_shared_article_comments",
        new=AsyncMock(
            return_value=[
                {
                    "id": str(uuid.uuid4()),
                    "author_name": "Guest",
                    "author_image": None,
                    "parent_comment_id": None,
                    "content": "Great summary",
                    "created_at": datetime(2026, 3, 22, 10, 0, tzinfo=UTC),
                    "empathy_count": 0,
                    "viewer_has_empathy": False,
                    "replies": [],
                }
            ]
        ),
        create=True,
    ):
        response = client.get(f"/api/articles/share/{share_id}/comments?token={token}")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["author_name"] == "Guest"
    assert payload[0]["content"] == "Great summary"


def test_post_shared_article_comment_requires_authentication() -> None:
    share_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"

    from src.main import app

    app.dependency_overrides.clear()

    client = TestClient(app)
    with patch.object(
        service,
        "create_shared_article_comment",
        new=AsyncMock(
            return_value={
                "id": str(uuid.uuid4()),
                "author_name": "Guest",
                "author_image": None,
                "parent_comment_id": None,
                "content": "Great summary",
                "created_at": datetime(2026, 3, 22, 10, 0, tzinfo=UTC),
                "empathy_count": 0,
                "viewer_has_empathy": False,
                "replies": [],
            }
        ),
        create=True,
    ):
        response = client.post(
            f"/api/articles/share/{share_id}/comments?token={token}",
            json={
                "content": "Great summary",
            },
        )

    assert response.status_code == 401


def test_post_shared_article_comment_returns_201_for_authenticated_user() -> None:
    user_id = str(uuid.uuid4())
    share_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"
    client = _make_test_client_with_user(user_id)

    with patch.object(
        service,
        "create_shared_article_comment",
        new=AsyncMock(
            return_value={
                "id": str(uuid.uuid4()),
                "author_name": "Viewer",
                "author_image": None,
                "parent_comment_id": None,
                "content": "Great summary",
                "created_at": datetime(2026, 3, 22, 10, 0, tzinfo=UTC),
                "empathy_count": 0,
                "viewer_has_empathy": False,
                "replies": [],
            }
        ),
        create=True,
    ):
        response = client.post(
            f"/api/articles/share/{share_id}/comments?token={token}",
            json={
                "content": "Great summary",
            },
        )

    assert response.status_code == 201
    payload = response.json()
    assert payload["author_name"] == "Viewer"
    assert payload["content"] == "Great summary"


def test_post_shared_article_empathy_returns_200_for_authenticated_user() -> None:
    user_id = str(uuid.uuid4())
    share_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"
    client = _make_test_client_with_user(user_id)

    with patch.object(
        service,
        "toggle_shared_article_empathy",
        new=AsyncMock(
            return_value={
                "empathy_count": 3,
                "viewer_has_empathy": True,
            }
        ),
        create=True,
    ):
        response = client.post(f"/api/articles/share/{share_id}/empathy?token={token}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["empathy_count"] == 3
    assert payload["viewer_has_empathy"] is True


def test_post_shared_article_empathy_requires_authentication() -> None:
    share_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"

    from src.main import app

    app.dependency_overrides.clear()
    client = TestClient(app)

    with patch.object(
        service,
        "toggle_shared_article_empathy",
        new=AsyncMock(return_value={"empathy_count": 1, "viewer_has_empathy": True}),
        create=True,
    ):
        response = client.post(f"/api/articles/share/{share_id}/empathy?token={token}")

    assert response.status_code == 401


def test_post_shared_article_comment_empathy_returns_200_for_authenticated_user() -> (
    None
):
    user_id = str(uuid.uuid4())
    share_id = str(uuid.uuid4())
    comment_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"
    client = _make_test_client_with_user(user_id)

    with patch.object(
        service,
        "toggle_shared_article_comment_empathy",
        new=AsyncMock(return_value={"empathy_count": 2, "viewer_has_empathy": True}),
        create=True,
    ):
        response = client.post(
            f"/api/articles/share/{share_id}/comments/{comment_id}/empathy?token={token}"
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["empathy_count"] == 2
    assert payload["viewer_has_empathy"] is True


def test_post_shared_article_comment_empathy_requires_authentication() -> None:
    share_id = str(uuid.uuid4())
    comment_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"

    from src.main import app

    app.dependency_overrides.clear()
    client = TestClient(app)

    with patch.object(
        service,
        "toggle_shared_article_comment_empathy",
        new=AsyncMock(return_value={"empathy_count": 1, "viewer_has_empathy": True}),
        create=True,
    ):
        response = client.post(
            f"/api/articles/share/{share_id}/comments/{comment_id}/empathy?token={token}"
        )

    assert response.status_code == 401


def test_patch_shared_article_comment_returns_200_for_authenticated_user() -> None:
    user_id = str(uuid.uuid4())
    share_id = str(uuid.uuid4())
    comment_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"
    client = _make_test_client_with_user(user_id)

    with patch.object(
        service,
        "update_shared_article_comment",
        new=AsyncMock(
            return_value={
                "id": comment_id,
                "author_name": "Viewer",
                "author_image": None,
                "author_user_id": user_id,
                "parent_comment_id": None,
                "content": "Updated comment",
                "created_at": datetime(2026, 3, 22, 10, 0, tzinfo=UTC),
                "empathy_count": 0,
                "viewer_has_empathy": False,
                "replies": [],
            }
        ),
        create=True,
    ):
        response = client.patch(
            f"/api/articles/share/{share_id}/comments/{comment_id}?token={token}",
            json={"content": "Updated comment"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == comment_id
    assert payload["content"] == "Updated comment"


def test_patch_shared_article_comment_requires_authentication() -> None:
    share_id = str(uuid.uuid4())
    comment_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"

    from src.main import app

    app.dependency_overrides.clear()
    client = TestClient(app)

    with patch.object(
        service,
        "update_shared_article_comment",
        new=AsyncMock(return_value=None),
        create=True,
    ):
        response = client.patch(
            f"/api/articles/share/{share_id}/comments/{comment_id}?token={token}",
            json={"content": "Updated comment"},
        )

    assert response.status_code == 401


def test_delete_shared_article_comment_returns_204_for_authenticated_user() -> None:
    user_id = str(uuid.uuid4())
    share_id = str(uuid.uuid4())
    comment_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"
    client = _make_test_client_with_user(user_id)

    with patch.object(
        service,
        "delete_shared_article_comment",
        new=AsyncMock(return_value=True),
        create=True,
    ):
        response = client.delete(
            f"/api/articles/share/{share_id}/comments/{comment_id}?token={token}"
        )

    assert response.status_code == 204


def test_delete_shared_article_comment_requires_authentication() -> None:
    share_id = str(uuid.uuid4())
    comment_id = str(uuid.uuid4())
    token = f"tok-{uuid.uuid4()}"

    from src.main import app

    app.dependency_overrides.clear()
    client = TestClient(app)

    with patch.object(
        service,
        "delete_shared_article_comment",
        new=AsyncMock(return_value=False),
        create=True,
    ):
        response = client.delete(
            f"/api/articles/share/{share_id}/comments/{comment_id}?token={token}"
        )

    assert response.status_code == 401
