import difflib
import hashlib
import inspect
import re
import secrets
import unicodedata
import uuid
from collections import Counter
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import cast as typing_cast

from sqlalchemy import String, cast, delete, func, or_, select, true, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from src.articles.model import (
    Article,
    ArticleEmbedding,
    ArticleShareComment,
    ArticleShareCommentEmpathy,
    ArticleShareEmpathy,
    ArticleShareLink,
    ArticleShareSlugHistory,
    ArticleSummary,
)
from src.articles.schemas import (
    ArticleCreate,
    ArticleListResponse,
    ArticleShareLinkCreate,
    ArticleShareLinkResponse,
    ArticleUpdate,
    ConceptGraphEdge,
    ConceptGraphMeta,
    ConceptGraphNode,
    ConceptGraphResponse,
    MyShareLinkItem,
    SharedArticleCommentCreate,
    SharedArticleCommentEmpathyResponse,
    SharedArticleCommentResponse,
    SharedArticleCommentUpdate,
    SharedArticleEmpathyResponse,
    SharedArticleSharerResponse,
    SharedArticleSummaryResponse,
    SimilarArticleResponse,
)
from src.common.models.pagination import PaginatedResponse
from src.users.model import User

ContentTypeStats = dict[str, int]


VALID_ARTICLE_STATUSES = {
    "pending",
    "processing",
    "analyzed",
    "failed",
    "completed",
}

VALID_SHARE_MODE_VALUES = {"default", "manual"}

DEFAULT_SHARE_SLUG = "shared-article"
SHARE_SID_LENGTH = 12
SHARE_UUID_SUFFIX_PATTERN = re.compile(
    r"^(?P<slug>.+)-(?P<share_uuid>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$"
)
SHARE_SID_SUFFIX_PATTERN = re.compile(r"^(?P<slug>.+)-(?P<share_sid>[0-9a-fA-F]{12})$")


def _slugify_share_title(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_text.casefold()
    cleaned = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    collapsed = re.sub(r"-{2,}", "-", cleaned)
    return collapsed[:120] if collapsed else DEFAULT_SHARE_SLUG


def _share_sid_from_uuid(value: uuid.UUID) -> str:
    return value.hex[:SHARE_SID_LENGTH]


def _canonical_share_path(share_slug: str, share_identifier: str) -> str:
    return f"/share/{share_slug}-{share_identifier}"


def _resolve_share_config(
    config: ArticleShareLinkCreate | None,
) -> tuple[str, str | None, str, str | None]:
    if config is None:
        return ("default", None, "default", None)

    url_mode = (
        config.url_mode if config.url_mode in VALID_SHARE_MODE_VALUES else "default"
    )
    thumbnail_mode = (
        config.thumbnail_mode
        if config.thumbnail_mode in VALID_SHARE_MODE_VALUES
        else "default"
    )

    custom_url = (config.custom_url or "").strip() or None
    thumbnail_url = (config.thumbnail_url or "").strip() or None

    if url_mode == "manual" and custom_url is None:
        url_mode = "default"

    if thumbnail_mode == "manual" and thumbnail_url is None:
        thumbnail_mode = "default"

    return (url_mode, custom_url, thumbnail_mode, thumbnail_url)


def _utc_now() -> datetime:
    return datetime.now(tz=UTC)


def _parse_uuid_or_none(value: str | None) -> uuid.UUID | None:
    if not value:
        return None
    try:
        return uuid.UUID(value)
    except (ValueError, TypeError):
        return None


async def _flush_if_possible(db: AsyncSession) -> None:
    flush_method = getattr(db, "flush", None)
    if flush_method is None or not callable(flush_method):
        return

    flush_callable = typing_cast(Callable[[], object], flush_method)
    flush_result = flush_callable()
    if inspect.isawaitable(flush_result):
        await typing_cast(Awaitable[object], flush_result)


def _hash_share_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def _get_valid_share_link(
    db: AsyncSession,
    share_id: uuid.UUID,
    token: str | None = None,
    *,
    with_relations: bool = False,
) -> ArticleShareLink | None:
    query = select(ArticleShareLink).where(ArticleShareLink.id == share_id)
    if with_relations:
        query = query.options(
            selectinload(ArticleShareLink.article).selectinload(Article.summary),
            selectinload(ArticleShareLink.owner_user),
        )

    result = await db.execute(query)
    share_link = result.scalar_one_or_none()
    if share_link is None:
        return None

    now = _utc_now()
    if share_link.revoked_at is not None:
        return None
    if share_link.expires_at is not None and share_link.expires_at <= now:
        return None

    # Public shares don't require token verification
    if share_link.is_public:
        return share_link

    # Private shares require valid token
    if token is None or share_link.token_hash != _hash_share_token(token):
        return None

    return share_link


async def create_or_regenerate_share_link(
    db: AsyncSession,
    article_id: uuid.UUID,
    owner_user_id: uuid.UUID,
    ttl: timedelta | None = None,
    config: ArticleShareLinkCreate | None = None,
) -> ArticleShareLinkResponse:
    article_result = await db.execute(
        select(Article).where(
            Article.id == article_id,
            Article.user_id == owner_user_id,
        )
    )
    article = article_result.scalar_one_or_none()
    if article is None:
        msg = "Article not found"
        raise ValueError(msg)

    result = await db.execute(
        select(ArticleShareLink).where(
            ArticleShareLink.article_id == article_id,
            ArticleShareLink.owner_user_id == owner_user_id,
        )
    )
    share_link = result.scalar_one_or_none()

    token = secrets.token_urlsafe(24)
    token_hash = _hash_share_token(token)
    expires_at = _utc_now() + ttl if ttl else None
    url_mode, custom_url, thumbnail_mode, thumbnail_url = _resolve_share_config(config)

    if share_link is None:
        share_uuid = uuid.uuid4()
        share_slug = _slugify_share_title(article.title)
        share_link = ArticleShareLink(
            id=share_uuid,
            article_id=article_id,
            owner_user_id=owner_user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked_at=None,
            share_slug=share_slug,
            share_sid=_share_sid_from_uuid(share_uuid),
            url_mode=url_mode,
            custom_url=custom_url,
            thumbnail_mode=thumbnail_mode,
            thumbnail_url=thumbnail_url,
        )
        db.add(share_link)
    else:
        existing_slug = share_link.share_slug
        next_slug = _slugify_share_title(article.title)
        if existing_slug and existing_slug != next_slug:
            # Only record history when slug actually changes, and avoid duplicates
            existing_history = await db.execute(
                select(ArticleShareSlugHistory.id).where(
                    ArticleShareSlugHistory.share_link_id == share_link.id,
                    ArticleShareSlugHistory.slug == existing_slug,
                )
            )
            if existing_history.scalar_one_or_none() is None:
                db.add(
                    ArticleShareSlugHistory(
                        share_link_id=share_link.id,
                        slug=existing_slug,
                    )
                )
        share_link.share_slug = next_slug
        share_link.share_sid = _share_sid_from_uuid(share_link.id)
        share_link.token_hash = token_hash
        share_link.expires_at = expires_at
        share_link.revoked_at = None
        share_link.url_mode = url_mode
        share_link.custom_url = custom_url
        share_link.thumbnail_mode = thumbnail_mode
        share_link.thumbnail_url = thumbnail_url

    await db.flush()

    share_slug = share_link.share_slug
    canonical_path = _canonical_share_path(share_slug, str(share_link.id))

    return ArticleShareLinkResponse(
        share_id=share_link.id,
        expires_at=share_link.expires_at,
        share_url=f"/share/{share_link.id}?token={token}",
        share_slug=share_slug,
        canonical_share_url=f"{canonical_path}?token={token}",
        url_mode=share_link.url_mode,
        custom_url=share_link.custom_url,
        thumbnail_mode=share_link.thumbnail_mode,
        thumbnail_url=share_link.thumbnail_url,
    )


async def list_my_share_links(
    db: AsyncSession,
    owner_user_id: uuid.UUID,
) -> list[MyShareLinkItem]:
    # Fetch owner username for public URL generation (safe if column missing)
    from src.users.model import User as UserModel

    owner_username: str | None = None
    try:
        owner_result = await db.execute(
            select(UserModel.username).where(UserModel.id == owner_user_id)
        )
        owner_username = owner_result.scalar_one_or_none()
    except Exception:  # noqa: S110
        # username column may not exist yet if migration hasn't been applied
        pass

    result = await db.execute(
        select(ArticleShareLink)
        .options(
            selectinload(ArticleShareLink.article).selectinload(Article.summary),
            selectinload(ArticleShareLink.comments),
            selectinload(ArticleShareLink.empathy_reactions),
        )
        .where(
            ArticleShareLink.owner_user_id == owner_user_id,
            ArticleShareLink.revoked_at.is_(None),
        )
        .order_by(ArticleShareLink.created_at.desc())
    )
    share_links = result.scalars().all()
    items: list[MyShareLinkItem] = []
    for sl in share_links:
        share_sid = _share_sid_from_uuid(sl.id)
        canonical_path = _canonical_share_path(sl.share_slug, share_sid)
        article = sl.article
        summary = article.summary if article else None
        summary_text = summary.summary if summary else None
        summary_preview = (
            summary_text[:400]
            if summary_text and len(summary_text) > 400
            else summary_text
        )
        concepts = summary.concepts if summary and summary.concepts else []
        content_type = summary.content_type if summary else None

        is_public = getattr(sl, "is_public", True)
        thumbnail_url = getattr(sl, "thumbnail_url", None)

        public_url: str | None = None
        if is_public and owner_username:
            public_url = f"/@{owner_username}/{sl.share_slug}"
        elif is_public:
            public_url = canonical_path

        items.append(
            MyShareLinkItem(
                share_id=sl.id,
                article_id=sl.article_id,
                article_title=article.title if article else "",
                article_url=article.url if article else None,
                share_slug=sl.share_slug,
                canonical_share_url=canonical_path,
                public_url=public_url,
                view_count=sl.view_count,
                empathy_count=len(sl.empathy_reactions),
                comment_count=len(sl.comments),
                summary_preview=summary_preview,
                concepts=concepts[:5],
                content_type=content_type,
                thumbnail_url=thumbnail_url,
                created_at=sl.created_at,
                expires_at=sl.expires_at,
            )
        )
    return items


async def revoke_share_link(
    db: AsyncSession,
    article_id: uuid.UUID,
    owner_user_id: uuid.UUID,
) -> bool:
    result = await db.execute(
        select(ArticleShareLink).where(
            ArticleShareLink.article_id == article_id,
            ArticleShareLink.owner_user_id == owner_user_id,
        )
    )
    share_link = result.scalar_one_or_none()
    if share_link is None:
        return False

    await db.delete(share_link)
    await db.flush()
    return True


async def get_shared_article_by_token(
    db: AsyncSession,
    share_id: uuid.UUID,
    token: str | None = None,
    viewer_user_id: str | None = None,
) -> SharedArticleSummaryResponse | None:
    share_link = await _get_valid_share_link(
        db,
        share_id,
        token,
        with_relations=True,
    )
    if share_link is None:
        return None

    # Increment view count
    share_link.view_count = (share_link.view_count or 0) + 1
    share_link.last_viewed_at = _utc_now()
    await _flush_if_possible(db)

    return await _build_shared_article_response(db, share_link, viewer_user_id)


async def _build_shared_article_response(
    db: AsyncSession,
    share_link: ArticleShareLink,
    viewer_user_id: str | None = None,
) -> SharedArticleSummaryResponse | None:
    article = share_link.article
    summary = article.summary if article else None
    if article is None or summary is None:
        return None

    owner_user = share_link.owner_user
    empathy_count_result = await db.execute(
        select(func.count())
        .select_from(ArticleShareEmpathy)
        .where(ArticleShareEmpathy.share_link_id == share_link.id)
    )
    empathy_count = int(empathy_count_result.scalar_one() or 0)

    viewer_uuid = _parse_uuid_or_none(viewer_user_id)
    viewer_has_empathy = False
    if viewer_uuid:
        viewer_empathy_result = await db.execute(
            select(ArticleShareEmpathy.id).where(
                ArticleShareEmpathy.share_link_id == share_link.id,
                ArticleShareEmpathy.user_id == viewer_uuid,
            )
        )
        viewer_has_empathy = viewer_empathy_result.scalar_one_or_none() is not None

    return SharedArticleSummaryResponse(
        share_id=share_link.id,
        share_slug=share_link.share_slug,
        share_sid=share_link.share_sid,
        canonical_share_path=_canonical_share_path(
            share_link.share_slug,
            str(share_link.id),
        ),
        article_id=article.id,
        title=article.title,
        source=article.source,
        url=article.url,
        created_at=share_link.created_at or article.created_at,
        summary=summary.summary,
        markdown_note=summary.markdown_note,
        key_points=summary.key_points,
        concepts=summary.concepts,
        reading_time_minutes=summary.reading_time_minutes,
        language=summary.language,
        content_type=summary.content_type,
        type_metadata=summary.type_metadata,
        empathy_count=empathy_count,
        viewer_has_empathy=viewer_has_empathy,
        is_owner=(
            viewer_user_id is not None
            and str(share_link.owner_user_id) == viewer_user_id
        ),
        sharer=SharedArticleSharerResponse(
            name=owner_user.name if owner_user else None,
            image=owner_user.image if owner_user else None,
        ),
        url_mode=share_link.url_mode or "default",
        custom_url=share_link.custom_url,
        thumbnail_mode=share_link.thumbnail_mode or "default",
        thumbnail_url=share_link.thumbnail_url,
        og_mode=share_link.thumbnail_mode or "default",
        og_image_url=share_link.thumbnail_url,
    )


async def get_shared_article_by_slug(
    db: AsyncSession,
    share_slug: str,
    token: str | None = None,
    viewer_user_id: str | None = None,
) -> SharedArticleSummaryResponse | None:
    normalized_slug = share_slug.strip()
    if not normalized_slug:
        return None

    share_uuid: uuid.UUID | None = None
    uuid_match = SHARE_UUID_SUFFIX_PATTERN.match(normalized_slug)
    sid_match = SHARE_SID_SUFFIX_PATTERN.match(normalized_slug)

    if uuid_match:
        share_uuid = uuid.UUID(uuid_match.group("share_uuid"))
    elif sid_match:
        share_identifier = sid_match.group("share_sid").lower()
        result = await db.execute(
            select(ArticleShareLink.id).where(
                ArticleShareLink.share_sid == share_identifier
            )
        )
        share_uuid = result.scalar_one_or_none()

    if share_uuid is None:
        candidate_ids_result = await db.execute(
            select(ArticleShareLink.id).where(
                func.lower(ArticleShareLink.share_slug) == normalized_slug.casefold()
            )
        )

        candidate_ids = [
            candidate_id for candidate_id in candidate_ids_result.scalars().all()
        ]

        if not candidate_ids:
            history_result = await db.execute(
                select(ArticleShareSlugHistory.share_link_id)
                .where(
                    func.lower(ArticleShareSlugHistory.slug)
                    == normalized_slug.casefold()
                )
                .order_by(ArticleShareSlugHistory.created_at.desc())
            )
            candidate_ids = [
                candidate_id for candidate_id in history_result.scalars().all()
            ]

        seen_ids: set[uuid.UUID] = set()
        for candidate_id in candidate_ids:
            if candidate_id in seen_ids:
                continue
            seen_ids.add(candidate_id)

            shared = await get_shared_article_by_token(
                db=db,
                share_id=candidate_id,
                token=token,
                viewer_user_id=viewer_user_id,
            )
            if shared is not None:
                return shared

        return None

    shared = await get_shared_article_by_token(
        db=db,
        share_id=share_uuid,
        token=token,
        viewer_user_id=viewer_user_id,
    )
    return shared


async def get_shared_article_by_username(
    db: AsyncSession,
    username: str,
    share_slug: str,
    viewer_user_id: str | None = None,
) -> SharedArticleSummaryResponse | None:
    from src.users.model import User as UserModel

    user_result = await db.execute(
        select(UserModel).where(
            func.lower(UserModel.username) == username.strip().casefold()
        )
    )
    user = user_result.scalar_one_or_none()
    if user is None:
        return None

    result = await db.execute(
        select(ArticleShareLink)
        .options(
            selectinload(ArticleShareLink.article).selectinload(Article.summary),
            selectinload(ArticleShareLink.owner_user),
        )
        .where(
            ArticleShareLink.owner_user_id == user.id,
            ArticleShareLink.is_public.is_(True),
            ArticleShareLink.revoked_at.is_(None),
            func.lower(ArticleShareLink.share_slug) == share_slug.strip().casefold(),
        )
    )
    share_link = result.scalar_one_or_none()
    if share_link is None:
        return None

    if share_link.expires_at is not None and share_link.expires_at <= _utc_now():
        return None

    # Increment view count
    share_link.view_count = (share_link.view_count or 0) + 1
    share_link.last_viewed_at = _utc_now()
    await _flush_if_possible(db)

    return await _build_shared_article_response(
        db=db,
        share_link=share_link,
        viewer_user_id=viewer_user_id,
    )


async def toggle_shared_article_empathy(
    db: AsyncSession,
    share_id: uuid.UUID,
    token: str,
    user_id: str,
) -> SharedArticleEmpathyResponse | None:
    share_link = await _get_valid_share_link(db, share_id, token)
    if share_link is None:
        return None

    user_uuid = uuid.UUID(user_id)
    existing_result = await db.execute(
        select(ArticleShareEmpathy).where(
            ArticleShareEmpathy.share_link_id == share_link.id,
            ArticleShareEmpathy.user_id == user_uuid,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing is None:
        db.add(
            ArticleShareEmpathy(
                share_link_id=share_link.id,
                user_id=user_uuid,
            )
        )
        viewer_has_empathy = True
    else:
        await db.delete(existing)
        viewer_has_empathy = False

    await db.flush()

    empathy_count_result = await db.execute(
        select(func.count())
        .select_from(ArticleShareEmpathy)
        .where(ArticleShareEmpathy.share_link_id == share_link.id)
    )
    empathy_count = int(empathy_count_result.scalar_one() or 0)

    return SharedArticleEmpathyResponse(
        empathy_count=empathy_count,
        viewer_has_empathy=viewer_has_empathy,
    )


async def list_shared_article_comments(
    db: AsyncSession,
    share_id: uuid.UUID,
    token: str,
    viewer_user_id: str | None = None,
) -> list[SharedArticleCommentResponse] | None:
    share_link = await _get_valid_share_link(db, share_id, token)
    if share_link is None:
        return None

    comments_result = await db.execute(
        select(ArticleShareComment)
        .where(ArticleShareComment.share_link_id == share_link.id)
        .order_by(ArticleShareComment.created_at.asc())
    )
    comments = comments_result.scalars().all()

    if not comments:
        return []

    comment_ids = [comment.id for comment in comments]

    empathy_count_rows = await db.execute(
        select(
            ArticleShareCommentEmpathy.comment_id,
            func.count().label("empathy_count"),
        )
        .where(ArticleShareCommentEmpathy.comment_id.in_(comment_ids))
        .group_by(ArticleShareCommentEmpathy.comment_id)
    )
    empathy_count_by_comment = {
        comment_id: int(empathy_count)
        for comment_id, empathy_count in empathy_count_rows.all()
    }

    viewer_uuid = _parse_uuid_or_none(viewer_user_id)
    viewer_empathy_comment_ids: set[uuid.UUID] = set()
    if viewer_uuid:
        viewer_rows = await db.execute(
            select(ArticleShareCommentEmpathy.comment_id).where(
                ArticleShareCommentEmpathy.comment_id.in_(comment_ids),
                ArticleShareCommentEmpathy.user_id == viewer_uuid,
            )
        )
        viewer_empathy_comment_ids = set(viewer_rows.scalars().all())

    response_by_id: dict[uuid.UUID, SharedArticleCommentResponse] = {}
    for comment in comments:
        response_by_id[comment.id] = SharedArticleCommentResponse(
            id=comment.id,
            author_name=comment.author_name,
            author_image=comment.author_image,
            author_user_id=comment.author_user_id,
            parent_comment_id=comment.parent_comment_id,
            content=comment.content,
            created_at=comment.created_at,
            empathy_count=empathy_count_by_comment.get(comment.id, 0),
            viewer_has_empathy=comment.id in viewer_empathy_comment_ids,
            replies=[],
        )

    roots: list[SharedArticleCommentResponse] = []
    for comment in comments:
        comment_response = response_by_id[comment.id]
        if comment.parent_comment_id is None:
            roots.append(comment_response)
            continue

        parent = response_by_id.get(comment.parent_comment_id)
        if parent is None:
            roots.append(comment_response)
            continue

        parent.replies.append(comment_response)

    for root in roots:
        root.replies.sort(key=lambda item: item.created_at)

    roots.sort(key=lambda item: item.created_at, reverse=True)

    return roots


async def create_shared_article_comment(
    db: AsyncSession,
    share_id: uuid.UUID,
    token: str,
    user_id: str,
    payload: SharedArticleCommentCreate,
) -> SharedArticleCommentResponse | None:
    share_link = await _get_valid_share_link(db, share_id, token)
    if share_link is None:
        return None

    user_result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = user_result.scalar_one_or_none()
    if user is None:
        return None

    author_name = (user.name or "").strip()
    if not author_name:
        author_name = (user.email or "").strip() or "NOD User"

    parent_comment_id = payload.parent_comment_id
    if parent_comment_id is not None:
        parent_result = await db.execute(
            select(ArticleShareComment).where(
                ArticleShareComment.id == parent_comment_id,
                ArticleShareComment.share_link_id == share_link.id,
            )
        )
        parent_comment = parent_result.scalar_one_or_none()
        if parent_comment is None:
            return None

        if parent_comment.parent_comment_id is not None:
            return None

    comment = ArticleShareComment(
        share_link_id=share_link.id,
        author_name=author_name,
        author_image=(user.image or None),
        author_user_id=user.id,
        parent_comment_id=parent_comment_id,
        content=payload.content.strip(),
    )
    db.add(comment)
    await db.flush()

    return SharedArticleCommentResponse(
        id=comment.id,
        author_name=comment.author_name,
        author_image=comment.author_image,
        author_user_id=comment.author_user_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        created_at=comment.created_at,
        empathy_count=0,
        viewer_has_empathy=False,
        replies=[],
    )


async def update_shared_article_comment(
    db: AsyncSession,
    share_id: uuid.UUID,
    token: str,
    comment_id: uuid.UUID,
    user_id: str,
    payload: SharedArticleCommentUpdate,
) -> SharedArticleCommentResponse | None:
    share_link = await _get_valid_share_link(db, share_id, token)
    if share_link is None:
        return None

    user_uuid = uuid.UUID(user_id)
    comment_result = await db.execute(
        select(ArticleShareComment).where(
            ArticleShareComment.id == comment_id,
            ArticleShareComment.share_link_id == share_link.id,
            ArticleShareComment.author_user_id == user_uuid,
        )
    )
    comment = comment_result.scalar_one_or_none()
    if comment is None:
        return None

    comment.content = payload.content.strip()
    await db.flush()

    empathy_count_result = await db.execute(
        select(func.count())
        .select_from(ArticleShareCommentEmpathy)
        .where(ArticleShareCommentEmpathy.comment_id == comment.id)
    )
    empathy_count = int(empathy_count_result.scalar_one() or 0)

    viewer_empathy_result = await db.execute(
        select(ArticleShareCommentEmpathy.id).where(
            ArticleShareCommentEmpathy.comment_id == comment.id,
            ArticleShareCommentEmpathy.user_id == user_uuid,
        )
    )
    viewer_has_empathy = viewer_empathy_result.scalar_one_or_none() is not None

    return SharedArticleCommentResponse(
        id=comment.id,
        author_name=comment.author_name,
        author_image=comment.author_image,
        author_user_id=comment.author_user_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        created_at=comment.created_at,
        empathy_count=empathy_count,
        viewer_has_empathy=viewer_has_empathy,
        replies=[],
    )


async def delete_shared_article_comment(
    db: AsyncSession,
    share_id: uuid.UUID,
    token: str,
    comment_id: uuid.UUID,
    user_id: str,
) -> bool:
    share_link = await _get_valid_share_link(db, share_id, token)
    if share_link is None:
        return False

    user_uuid = uuid.UUID(user_id)
    comment_result = await db.execute(
        select(ArticleShareComment.id).where(
            ArticleShareComment.id == comment_id,
            ArticleShareComment.share_link_id == share_link.id,
            ArticleShareComment.author_user_id == user_uuid,
        )
    )
    if comment_result.scalar_one_or_none() is None:
        return False

    await db.execute(
        delete(ArticleShareComment).where(ArticleShareComment.id == comment_id)
    )
    await db.flush()
    return True


async def toggle_shared_article_comment_empathy(
    db: AsyncSession,
    share_id: uuid.UUID,
    token: str,
    comment_id: uuid.UUID,
    user_id: str,
) -> SharedArticleCommentEmpathyResponse | None:
    share_link = await _get_valid_share_link(db, share_id, token)
    if share_link is None:
        return None

    comment_result = await db.execute(
        select(ArticleShareComment).where(
            ArticleShareComment.id == comment_id,
            ArticleShareComment.share_link_id == share_link.id,
        )
    )
    comment = comment_result.scalar_one_or_none()
    if comment is None:
        return None

    user_uuid = uuid.UUID(user_id)
    existing_result = await db.execute(
        select(ArticleShareCommentEmpathy).where(
            ArticleShareCommentEmpathy.comment_id == comment_id,
            ArticleShareCommentEmpathy.user_id == user_uuid,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing is None:
        db.add(
            ArticleShareCommentEmpathy(
                comment_id=comment_id,
                user_id=user_uuid,
            )
        )
        viewer_has_empathy = True
    else:
        await db.delete(existing)
        viewer_has_empathy = False

    await db.flush()

    empathy_count_result = await db.execute(
        select(func.count())
        .select_from(ArticleShareCommentEmpathy)
        .where(ArticleShareCommentEmpathy.comment_id == comment_id)
    )
    empathy_count = int(empathy_count_result.scalar_one() or 0)

    return SharedArticleCommentEmpathyResponse(
        empathy_count=empathy_count,
        viewer_has_empathy=viewer_has_empathy,
    )


async def create_article(
    db: AsyncSession,
    user_id: str,
    data: ArticleCreate,
) -> Article:
    article = Article(
        user_id=uuid.UUID(user_id),
        url=data.url,
        title=data.title,
        original_title=data.title,
        content=data.content,
        source=data.source,
        requested_summary_language=data.requested_summary_language,
    )
    db.add(article)
    await db.flush()

    # Re-query with eager load to avoid MissingGreenlet on relationship access
    result = await db.execute(
        select(Article)
        .options(selectinload(Article.summary))
        .where(Article.id == article.id)
    )
    return result.scalar_one()


async def update_article_status(article_id: uuid.UUID, status: str) -> None:
    """Update article status by article ID."""
    if status not in VALID_ARTICLE_STATUSES:
        msg = f"Invalid article status: {status}"
        raise ValueError(msg)

    from src.lib.database import async_session_factory

    async with async_session_factory() as session:
        await session.execute(
            update(Article).where(Article.id == article_id).values(status=status)
        )
        await session.commit()


async def get_article(
    db: AsyncSession,
    article_id: uuid.UUID,
    user_id: str,
) -> Article | None:
    result = await db.execute(
        select(Article)
        .options(selectinload(Article.summary))
        .where(Article.id == article_id, Article.user_id == uuid.UUID(user_id))
    )
    return result.scalar_one_or_none()


async def get_article_by_url(
    db: AsyncSession,
    user_id: str,
    url: str,
) -> Article | None:
    result = await db.execute(
        select(Article)
        .options(selectinload(Article.summary))
        .where(Article.user_id == uuid.UUID(user_id), Article.url == url)
        .order_by(Article.created_at.desc())
    )
    return result.scalars().first()


async def list_articles(
    db: AsyncSession,
    user_id: str,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    status_filter: str | None = None,
    content_type_filter: str | None = None,
) -> PaginatedResponse[ArticleListResponse]:
    base_query = select(Article).where(Article.user_id == uuid.UUID(user_id))

    has_summary_join = False
    if search:
        search_term = search.strip()
        if search_term:
            term = f"%{search_term}%"
            base_query = base_query.outerjoin(
                ArticleSummary, ArticleSummary.article_id == Article.id
            ).where(
                or_(
                    Article.title.ilike(term),
                    Article.content.ilike(term),
                    ArticleSummary.summary.ilike(term),
                    cast(ArticleSummary.concepts, String).ilike(term),
                )
            )
            has_summary_join = True
    if status_filter:
        base_query = base_query.where(Article.status == status_filter)
    if content_type_filter:
        if not has_summary_join:
            base_query = base_query.outerjoin(
                ArticleSummary, ArticleSummary.article_id == Article.id
            )
        base_query = base_query.where(
            ArticleSummary.content_type == content_type_filter
        )

    # Count
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Fetch with summary eager load
    query = (
        base_query.options(selectinload(Article.summary))
        .order_by(Article.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(query)
    articles = result.scalars().all()

    items = [
        ArticleListResponse(
            id=a.id,
            url=a.url,
            title=a.title,
            source=a.source,
            status=a.status,
            created_at=a.created_at,
            summary_preview=a.summary.summary[:200] if a.summary else None,
            content_type=a.summary.content_type if a.summary else None,
        )
        for a in articles
    ]

    return PaginatedResponse.create(
        data=items,
        total=total,
        page=page,
        limit=limit,
    )


async def update_article(
    db: AsyncSession,
    article_id: uuid.UUID,
    user_id: str,
    data: ArticleUpdate,
) -> Article | None:
    article = await get_article(db, article_id, user_id)
    if not article:
        return None
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return article
    await db.execute(
        update(Article)
        .where(Article.id == article_id, Article.user_id == uuid.UUID(user_id))
        .values(**update_data)
    )
    await db.flush()
    return await get_article(db, article_id, user_id)


async def delete_article(
    db: AsyncSession,
    article_id: uuid.UUID,
    user_id: str,
) -> bool:
    uid = uuid.UUID(user_id)
    existing = await db.execute(
        select(Article.id).where(Article.id == article_id, Article.user_id == uid)
    )
    if existing.scalar_one_or_none() is None:
        return False

    await db.execute(
        delete(Article).where(Article.id == article_id, Article.user_id == uid)
    )
    return True


async def search_articles_semantic(
    db: AsyncSession,
    user_id: str,
    query_embedding: list[float],
    page: int = 1,
    limit: int = 20,
    status_filter: str | None = None,
    content_type_filter: str | None = None,
    similarity_threshold: float = 0.3,
) -> PaginatedResponse[ArticleListResponse]:
    similarity_expr = 1 - ArticleEmbedding.embedding.cosine_distance(query_embedding)

    base_query = (
        select(Article, similarity_expr.label("similarity"))
        .join(ArticleEmbedding, ArticleEmbedding.article_id == Article.id)
        .where(
            Article.user_id == uuid.UUID(user_id),
            similarity_expr >= similarity_threshold,
        )
    )

    if status_filter:
        base_query = base_query.where(Article.status == status_filter)
    if content_type_filter:
        base_query = base_query.outerjoin(
            ArticleSummary, ArticleSummary.article_id == Article.id
        ).where(ArticleSummary.content_type == content_type_filter)

    # Count
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Fetch ordered by similarity desc with summary eager load
    query = (
        base_query.options(selectinload(Article.summary))
        .order_by(ArticleEmbedding.embedding.cosine_distance(query_embedding))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()

    items = [
        ArticleListResponse(
            id=article.id,
            url=article.url,
            title=article.title,
            source=article.source,
            status=article.status,
            created_at=article.created_at,
            summary_preview=article.summary.summary[:200] if article.summary else None,
            content_type=article.summary.content_type if article.summary else None,
        )
        for article, _similarity in rows
    ]

    return PaginatedResponse.create(
        data=items,
        total=total,
        page=page,
        limit=limit,
    )


async def get_similar_articles(
    db: AsyncSession,
    article_id: uuid.UUID,
    user_id: str,
    limit: int = 5,
) -> list[SimilarArticleResponse]:
    # Get the target article's embedding
    embedding_result = await db.execute(
        select(ArticleEmbedding).where(ArticleEmbedding.article_id == article_id)
    )
    target_embedding = embedding_result.scalar_one_or_none()

    if not target_embedding:
        return []

    # Find similar articles using cosine distance
    similarity_expr = 1 - ArticleEmbedding.embedding.cosine_distance(
        target_embedding.embedding
    )

    query = (
        select(
            Article,
            similarity_expr.label("similarity"),
        )
        .join(ArticleEmbedding, ArticleEmbedding.article_id == Article.id)
        .options(selectinload(Article.summary))
        .where(
            Article.user_id == uuid.UUID(user_id),
            Article.id != article_id,
        )
        .order_by(
            ArticleEmbedding.embedding.cosine_distance(target_embedding.embedding)
        )
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    # Get target concepts for overlap calculation
    target_summary_result = await db.execute(
        select(ArticleSummary).where(ArticleSummary.article_id == article_id)
    )
    target_summary = target_summary_result.scalar_one_or_none()
    target_concepts = set(target_summary.concepts) if target_summary else set()

    similar = []
    for article, similarity in rows:
        article_concepts = set(article.summary.concepts) if article.summary else set()
        shared = list(target_concepts & article_concepts)
        similar.append(
            SimilarArticleResponse(
                id=article.id,
                title=article.title,
                url=article.url,
                source=article.source,
                similarity=round(float(similarity), 4),
                shared_concepts=shared,
                summary_preview=article.summary.summary[:200]
                if article.summary
                else None,
            )
        )

    return similar


CANONICAL_MAPPINGS = {
    "타입스크립트": "typescript",
    "typescript 배우기": "typescript",
    "자바스크립트": "javascript",
    "javascript 기초": "javascript",
    "파이썬": "python",
    "리액트": "react",
    "react.js": "react",
    "reactjs": "react",
    "넥스트js": "nextjs",
    "next.js": "nextjs",
    "네스트js": "nestjs",
    "nest.js": "nestjs",
    "노드js": "nodejs",
    "node.js": "nodejs",
    "nodejs": "nodejs",
    "fastapi": "fastapi",
    "장고": "django",
    "스프링부트": "springboot",
    "spring boot": "springboot",
    "도커": "docker",
    "쿠버네티스": "kubernetes",
    "k8s": "kubernetes",
    "aws": "aws",
    "아마존웹서비스": "aws",
    "llm": "llm",
    "대규모언어모델": "llm",
}


REMOVE_TOKENS = {
    "배우기",
    "정리",
    "입문",
    "기초",
    "tutorial",
    "guide",
    "basics",
    "how to",
    "learn",
}


def _normalize_concept(value: str) -> str:
    if not value:
        return ""

    # 1. Unicode normalization (NFKC)
    normalized = unicodedata.normalize("NFKC", value)

    # 2. Remove parentheses/brackets and their content, and quotes
    normalized = re.sub(r"\([^)]*\)", "", normalized)
    normalized = re.sub(r"\[[^]]*\]", "", normalized)
    normalized = re.sub(r"[\"']", "", normalized)

    # 3. Casefold
    normalized = normalized.casefold()

    # 4. Remove common suffix/prefix tokens
    # "how to" contains space, so handle it before splitting
    normalized = normalized.replace("how to", "")

    tokens = normalized.split()
    tokens = [t for t in tokens if t not in REMOVE_TOKENS]
    normalized = " ".join(tokens).strip()

    return CANONICAL_MAPPINGS.get(normalized, normalized)


def _resolve_similar_concept(
    target: str, existing_concepts: list[str], threshold: float = 0.92
) -> str:
    """
    Resolve a concept to an existing similar concept if similarity > threshold.
    Uses difflib.SequenceMatcher for similarity.
    """
    if not existing_concepts:
        return target

    # Fast path: exact match
    if target in existing_concepts:
        return target

    matcher = difflib.SequenceMatcher(None, target, "")
    best_ratio = 0.0
    best_match = None

    for existing in existing_concepts:
        matcher.set_seq2(existing)
        ratio = matcher.ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = existing

    if best_ratio >= threshold and best_match:
        return best_match

    return target


def resolve_concept_candidates(
    root_concept_label: str | None,
    concepts: list[str] | None,
    existing_norms: list[str],
    max_candidates: int = 2,
    threshold: float = 0.92,
) -> tuple[str | None, str | None, list[str]]:
    labels: list[str] = []

    root_label = " ".join((root_concept_label or "").split()).strip()
    if root_label:
        labels.append(root_label)

    if isinstance(concepts, list):
        for raw in concepts:
            if not isinstance(raw, str):
                continue
            label = " ".join(raw.split()).strip()
            if label:
                labels.append(label)

    known_norms = [norm for norm in existing_norms if norm]
    resolved: list[tuple[str, str]] = []
    seen_norms: set[str] = set()

    for label in labels:
        raw_norm = _normalize_concept(label)
        if not raw_norm:
            continue

        final_norm = _resolve_similar_concept(
            raw_norm, known_norms, threshold=threshold
        )
        if final_norm in seen_norms:
            continue

        seen_norms.add(final_norm)
        if final_norm not in known_norms:
            known_norms.append(final_norm)

        canonical_label = final_norm
        resolved.append((canonical_label, final_norm))

        if len(resolved) >= max_candidates:
            break

    if not resolved:
        return (None, None, [])

    root_label_resolved, root_norm = resolved[0]
    concept_labels = [label for label, _norm in resolved]
    return (root_label_resolved, root_norm, concept_labels)


async def get_concept_graph(
    db: AsyncSession,
    user_id: str,
    root: str | None = None,
    mode: str | None = None,
    max_nodes: int = 1000,
) -> ConceptGraphResponse:
    if mode == "global" and not root:
        return await _get_global_graph(db, user_id=user_id, max_nodes=max_nodes)

    rows = await db.execute(
        select(
            Article.id,
            Article.title,
            ArticleSummary.concepts,
            ArticleSummary.root_concept_label,
            ArticleSummary.root_concept_norm,
        )
        .join(Article, ArticleSummary.article_id == Article.id)
        .where(
            Article.user_id == uuid.UUID(user_id),
            Article.status.in_(["analyzed", "completed"]),
        )
    )
    article_rows = rows.all()

    def extract_root(
        concepts: object,
        root_concept_label: str | None,
        root_concept_norm: str | None,
    ) -> tuple[str, str] | None:
        normalized = _normalize_concept(root_concept_norm or "")
        label = " ".join((root_concept_label or "").split()).strip()

        if normalized:
            return (label or normalized, normalized)

        if label:
            label_norm = _normalize_concept(label)
            if label_norm:
                return (label, label_norm)

        if isinstance(concepts, list):
            for raw in concepts:
                if not isinstance(raw, str):
                    continue
                fallback_label = " ".join(raw.split()).strip()
                if not fallback_label:
                    continue
                fallback_norm = _normalize_concept(fallback_label)
                if fallback_norm:
                    return (fallback_label, fallback_norm)

        return None

    concept_counts: Counter[str] = Counter()
    concept_labels: dict[str, Counter[str]] = {}
    resolved_roots: list[tuple[uuid.UUID, str, str, str]] = []

    for (
        article_id,
        title,
        concepts,
        root_concept_label,
        root_concept_norm,
    ) in article_rows:
        extracted = extract_root(concepts, root_concept_label, root_concept_norm)
        if not extracted:
            continue

        label, normalized = extracted
        concept_counts[normalized] += 1
        label_counter = concept_labels.setdefault(normalized, Counter())
        label_counter[label] += 1
        resolved_roots.append((article_id, title, label, normalized))

    if root:
        requested = root.strip()
        if requested.startswith("concept:"):
            requested = requested.split(":", 1)[1]
        requested_norm = _normalize_concept(requested)

        if not requested_norm:
            return ConceptGraphResponse(
                nodes=[],
                edges=[],
                meta=ConceptGraphMeta(
                    total_articles=0,
                    total_unique_concepts=0,
                    returned_nodes=0,
                    returned_edges=0,
                    max_nodes=max_nodes,
                ),
            )

        matching_articles = [
            (article_id, title)
            for article_id, title, _label, normalized in resolved_roots
            if normalized == requested_norm
        ]
        matching_articles = matching_articles[: max(0, max_nodes - 1)]

        if not matching_articles:
            return ConceptGraphResponse(
                nodes=[],
                edges=[],
                meta=ConceptGraphMeta(
                    total_articles=0,
                    total_unique_concepts=0,
                    returned_nodes=0,
                    returned_edges=0,
                    max_nodes=max_nodes,
                ),
            )

        root_label_counts = concept_labels.get(requested_norm, Counter())
        root_label = (
            root_label_counts.most_common(1)[0][0]
            if root_label_counts
            else requested_norm
        )
        root_node_id = f"concept:{requested_norm}"

        article_nodes = [
            ConceptGraphNode(
                id=f"article:{article_id}",
                label=title,
                value=1,
                kind="article",
                article_id=article_id,
            )
            for article_id, title in matching_articles
        ]
        edges = [
            ConceptGraphEdge(
                source=root_node_id,
                target=node.id,
                weight=1,
            )
            for node in article_nodes
        ]

        return ConceptGraphResponse(
            nodes=[
                ConceptGraphNode(
                    id=root_node_id,
                    label=root_label,
                    value=len(matching_articles),
                    kind="concept",
                ),
                *article_nodes,
            ],
            edges=edges,
            meta=ConceptGraphMeta(
                total_articles=len(matching_articles),
                total_unique_concepts=1,
                returned_nodes=1 + len(article_nodes),
                returned_edges=len(edges),
                max_nodes=max_nodes,
            ),
        )

    selected_norms = [
        concept for concept, _count in concept_counts.most_common(max_nodes)
    ]

    nodes: list[ConceptGraphNode] = []
    for norm in selected_norms:
        label_counts = concept_labels.get(norm)
        if not label_counts:
            continue
        label = label_counts.most_common(1)[0][0]
        nodes.append(
            ConceptGraphNode(
                id=f"concept:{norm}",
                label=label,
                value=concept_counts[norm],
                kind="concept",
            )
        )

    return ConceptGraphResponse(
        nodes=nodes,
        edges=[],
        meta=ConceptGraphMeta(
            total_articles=len(resolved_roots),
            total_unique_concepts=len(concept_counts),
            returned_nodes=len(nodes),
            returned_edges=0,
            max_nodes=max_nodes,
        ),
    )


async def _get_global_graph(
    db: AsyncSession,
    user_id: str,
    max_nodes: int,
) -> ConceptGraphResponse:
    from sqlalchemy import func

    max_nodes = max(100, min(1000, max_nodes))

    per_article_concepts = 2
    k_neighbors = 10

    article_budget = min(max_nodes, int(max_nodes * 0.65))
    concept_budget = max_nodes - article_budget

    total_articles_result = await db.execute(
        select(func.count())
        .select_from(Article)
        .where(
            Article.user_id == uuid.UUID(user_id),
            Article.status.in_(["analyzed", "completed"]),
        )
    )
    total_articles = int(total_articles_result.scalar_one() or 0)

    rows = await db.execute(
        select(
            Article.id,
            Article.title,
            Article.created_at,
            ArticleSummary.concepts,
            ArticleSummary.root_concept_label,
            ArticleSummary.root_concept_norm,
        )
        .join(Article, ArticleSummary.article_id == Article.id)
        .where(
            Article.user_id == uuid.UUID(user_id),
            Article.status.in_(["analyzed", "completed"]),
        )
        .order_by(Article.created_at.desc())
        .limit(article_budget)
    )
    article_rows = rows.all()

    def _clean_label(value: str) -> str:
        return " ".join(value.split()).strip()

    def extract_root(
        concepts: object,
        root_concept_label: str | None,
        root_concept_norm: str | None,
    ) -> tuple[str, str] | None:
        normalized = _normalize_concept(root_concept_norm or "")
        label = _clean_label(root_concept_label or "")
        if normalized:
            return (label or normalized, normalized)
        if label:
            label_norm = _normalize_concept(label)
            if label_norm:
                return (label, label_norm)
        if isinstance(concepts, list):
            for raw in concepts:
                if not isinstance(raw, str):
                    continue
                fallback_label = _clean_label(raw)
                if not fallback_label:
                    continue
                fallback_norm = _normalize_concept(fallback_label)
                if fallback_norm:
                    return (fallback_label, fallback_norm)
        return None

    def extract_concepts(
        concepts: object,
        root_concept_label: str | None,
        root_concept_norm: str | None,
    ) -> list[tuple[str, str]]:
        extracted: list[tuple[str, str]] = []
        seen: set[str] = set()

        root_pair = extract_root(concepts, root_concept_label, root_concept_norm)
        if root_pair:
            label, norm = root_pair
            if norm and norm not in seen:
                extracted.append((label, norm))
                seen.add(norm)

        if isinstance(concepts, list):
            for raw in concepts:
                if not isinstance(raw, str):
                    continue
                label = _clean_label(raw)
                if not label:
                    continue
                norm = _normalize_concept(label)
                if not norm or norm in seen:
                    continue
                extracted.append((label, norm))
                seen.add(norm)
                if len(extracted) >= per_article_concepts:
                    break

        return extracted

    concept_counts: Counter[str] = Counter()
    concept_labels: dict[str, Counter[str]] = {}
    norm_redirects: dict[str, str] = {}

    article_to_concepts: dict[uuid.UUID, list[str]] = {}
    article_titles: dict[uuid.UUID, str] = {}

    for (
        article_id,
        title,
        _created_at,
        concepts,
        root_concept_label,
        root_concept_norm,
    ) in article_rows:
        pairs = extract_concepts(concepts, root_concept_label, root_concept_norm)
        if not pairs:
            continue

        article_titles[article_id] = title
        final_norms: list[str] = []
        seen_norms: set[str] = set()

        for label, raw_norm in pairs:
            if raw_norm in norm_redirects:
                final_norm = norm_redirects[raw_norm]
            else:
                existing_norms = list(concept_counts.keys())
                final_norm = _resolve_similar_concept(raw_norm, existing_norms)
                norm_redirects[raw_norm] = final_norm

            if final_norm not in seen_norms:
                seen_norms.add(final_norm)
                final_norms.append(final_norm)
                concept_counts[final_norm] += 1
                concept_labels.setdefault(final_norm, Counter())[label] += 1

        article_to_concepts[article_id] = final_norms

    if not article_to_concepts:
        return ConceptGraphResponse(
            nodes=[],
            edges=[],
            meta=ConceptGraphMeta(
                total_articles=total_articles,
                total_unique_concepts=0,
                returned_nodes=0,
                returned_edges=0,
                max_nodes=max_nodes,
            ),
        )

    root_norms: set[str] = set()
    for aid in article_to_concepts:
        first = article_to_concepts[aid][0] if article_to_concepts[aid] else None
        if first:
            root_norms.add(first)

    selected_concepts: list[str] = []
    for norm in sorted(root_norms):
        if norm not in selected_concepts:
            selected_concepts.append(norm)

    for norm, _count in concept_counts.most_common(concept_budget):
        if len(selected_concepts) >= concept_budget:
            break
        if norm not in selected_concepts:
            selected_concepts.append(norm)

    concept_node_ids = {f"concept:{norm}" for norm in selected_concepts}

    article_ids = list(article_to_concepts.keys())
    nodes: list[ConceptGraphNode] = []

    for norm in selected_concepts:
        label_counts = concept_labels.get(norm)
        label = label_counts.most_common(1)[0][0] if label_counts else norm
        nodes.append(
            ConceptGraphNode(
                id=f"concept:{norm}",
                label=label,
                value=concept_counts[norm],
                kind="concept",
            )
        )

    for aid in article_ids:
        nodes.append(
            ConceptGraphNode(
                id=f"article:{aid}",
                label=article_titles.get(aid, str(aid)),
                value=1,
                kind="article",
                article_id=aid,
            )
        )

    edge_set: set[tuple[str, str]] = set()
    edges: list[ConceptGraphEdge] = []

    def add_edge(a: str, b: str, weight: int) -> None:
        if a == b:
            return
        key = (a, b) if a < b else (b, a)
        if key in edge_set:
            return
        edge_set.add(key)
        edges.append(ConceptGraphEdge(source=key[0], target=key[1], weight=weight))

    for aid, norms in article_to_concepts.items():
        article_node = f"article:{aid}"
        for norm in norms:
            concept_node = f"concept:{norm}"
            if concept_node not in concept_node_ids:
                continue
            add_edge(article_node, concept_node, 10)

    from src.articles.model import ArticleEmbedding

    embedding_rows = await db.execute(
        select(ArticleEmbedding.article_id).where(
            ArticleEmbedding.article_id.in_(article_ids)
        )
    )
    embedding_article_ids = [row[0] for row in embedding_rows.all()]

    if embedding_article_ids:
        src = ArticleEmbedding
        nn = aliased(ArticleEmbedding)
        src_ids = embedding_article_ids

        lateral_q = (
            select(
                nn.article_id.label("neighbor_id"),
                (1 - nn.embedding.cosine_distance(src.embedding)).label("sim"),
            )
            .where(
                nn.article_id != src.article_id,
                nn.article_id.in_(src_ids),
            )
            .order_by(nn.embedding.cosine_distance(src.embedding))
            .limit(k_neighbors)
            .lateral()
        )

        sim_rows = await db.execute(
            select(src.article_id, lateral_q.c.neighbor_id, lateral_q.c.sim)
            .select_from(src)
            .join(lateral_q, true())
            .where(src.article_id.in_(src_ids))
        )
        for source_id, neighbor_id, sim in sim_rows.all():
            if source_id == neighbor_id:
                continue
            similarity = float(sim) if sim is not None else 0.0
            if similarity <= 0:
                continue
            weight = max(1, min(100, round(similarity * 100)))
            add_edge(f"article:{source_id}", f"article:{neighbor_id}", weight)

    embedded_set = set(embedding_article_ids)
    root_to_any_article: dict[str, uuid.UUID] = {}
    for aid, norms in article_to_concepts.items():
        if norms:
            root_to_any_article.setdefault(norms[0], aid)

    for aid, norms in article_to_concepts.items():
        if aid in embedded_set:
            continue
        if not norms:
            continue
        root_norm = norms[0]
        other = root_to_any_article.get(root_norm)
        if other and other != aid:
            add_edge(f"article:{aid}", f"article:{other}", 30)

    returned_nodes = len(nodes)
    returned_edges = len(edges)

    return ConceptGraphResponse(
        nodes=nodes,
        edges=edges,
        meta=ConceptGraphMeta(
            total_articles=total_articles,
            total_unique_concepts=len(selected_concepts),
            returned_nodes=returned_nodes,
            returned_edges=returned_edges,
            max_nodes=max_nodes,
        ),
    )


async def get_content_type_stats(
    db: AsyncSession,
    user_id: str,
) -> dict[str, int]:
    """Return article counts grouped by content_type for a user."""
    rows = await db.execute(
        select(
            func.coalesce(ArticleSummary.content_type, "general_news"),
            func.count(),
        )
        .join(Article, ArticleSummary.article_id == Article.id)
        .where(
            Article.user_id == uuid.UUID(user_id),
            Article.status.in_(["analyzed", "completed"]),
        )
        .group_by(func.coalesce(ArticleSummary.content_type, "general_news"))
    )
    return {content_type: count for content_type, count in rows.all()}
