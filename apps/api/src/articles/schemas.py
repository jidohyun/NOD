import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ArticleCreate(BaseModel):
    url: str | None = Field(None, max_length=2048)
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    source: str = Field(default="web", pattern="^(web|extension|api)$")
    requested_summary_language: str | None = Field(default=None, max_length=10)


class ArticleAnalyzeURL(BaseModel):
    url: str = Field(..., max_length=2048)
    title: str = Field(..., min_length=1, max_length=500)
    content: str | None = Field(default=None)
    source: str = Field(default="extension", pattern="^(web|extension|api)$")
    summary_language: str | None = Field(
        default=None,
        description=(
            "Language for the AI summary "
            "(e.g. 'ko', 'en', 'ja'). "
            "Defaults to Korean if not specified."
        ),
    )


class SummaryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    summary: str
    markdown_note: str | None = None
    concepts: list[str]
    key_points: list[str]
    reading_time_minutes: int | None = None
    language: str | None = None
    ai_provider: str
    ai_model: str
    content_type: str = "general_news"
    type_metadata: dict[str, object] = {}
    created_at: datetime


class ArticleResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    url: str | None = None
    title: str
    original_title: str | None = None
    source: str
    status: str
    created_at: datetime
    updated_at: datetime | None = None
    summary: SummaryResponse | None = None


class ArticleSaveResponse(ArticleResponse):
    already_saved: bool = False


class ArticleListResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    url: str | None = None
    title: str
    source: str
    status: str
    created_at: datetime
    summary_preview: str | None = None
    content_type: str | None = None


class SimilarArticleResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    title: str
    url: str | None = None
    source: str
    similarity: float
    shared_concepts: list[str] = []
    summary_preview: str | None = None


class ConceptGraphNode(BaseModel):
    id: str
    label: str
    value: int
    kind: str | None = None
    article_id: uuid.UUID | None = None


class ConceptGraphEdge(BaseModel):
    source: str
    target: str
    weight: int


class ConceptGraphMeta(BaseModel):
    total_articles: int
    total_unique_concepts: int
    returned_nodes: int
    returned_edges: int
    max_nodes: int


class ConceptGraphResponse(BaseModel):
    nodes: list[ConceptGraphNode]
    edges: list[ConceptGraphEdge]
    meta: ConceptGraphMeta


class ContentTypeStatsResponse(BaseModel):
    counts: dict[str, int]
    total: int


class ArticleUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)


class ArticleShareLinkResponse(BaseModel):
    share_id: uuid.UUID
    expires_at: datetime | None = None
    share_url: str
    share_slug: str
    canonical_share_url: str
    url_mode: str = "default"
    custom_url: str | None = None
    thumbnail_mode: str = "default"
    thumbnail_url: str | None = None


class MyShareLinkItem(BaseModel):
    share_id: uuid.UUID
    article_id: uuid.UUID
    article_title: str
    article_url: str | None = None
    share_slug: str
    canonical_share_url: str
    public_url: str | None = None
    view_count: int = 0
    empathy_count: int = 0
    comment_count: int = 0
    summary_preview: str | None = None
    concepts: list[str] = []
    content_type: str | None = None
    thumbnail_url: str | None = None
    created_at: datetime
    expires_at: datetime | None = None


class ArticleShareLinkCreate(BaseModel):
    url_mode: str = Field(default="default", pattern="^(default|manual)$")
    custom_url: str | None = Field(default=None, min_length=1, max_length=180)
    thumbnail_mode: str = Field(default="default", pattern="^(default|manual)$")
    thumbnail_url: str | None = Field(default=None, max_length=2048)

    @field_validator("custom_url")
    @classmethod
    def validate_custom_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    @field_validator("thumbnail_url")
    @classmethod
    def validate_thumbnail_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        if not trimmed:
            return None
        if not (trimmed.startswith("https://") or trimmed.startswith("http://")):
            msg = "thumbnail_url must start with http:// or https://"
            raise ValueError(msg)
        return trimmed


class SharedArticleSharerResponse(BaseModel):
    name: str | None = None
    image: str | None = None


class SharedArticleSummaryResponse(BaseModel):
    share_id: uuid.UUID
    share_slug: str
    share_sid: str
    canonical_share_path: str
    article_id: uuid.UUID
    title: str
    source: str
    url: str | None = None
    created_at: datetime
    summary: str
    markdown_note: str | None = None
    key_points: list[str]
    concepts: list[str]
    reading_time_minutes: int | None = None
    language: str | None = None
    content_type: str
    type_metadata: dict[str, object]
    empathy_count: int = 0
    viewer_has_empathy: bool = False
    is_owner: bool = False
    sharer: SharedArticleSharerResponse
    url_mode: str = "default"
    custom_url: str | None = None
    thumbnail_mode: str = "default"
    thumbnail_url: str | None = None
    og_mode: str = "default"
    og_image_url: str | None = None


class SharedArticleCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_comment_id: uuid.UUID | None = None


class SharedArticleCommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class SharedArticleCommentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    author_name: str
    author_image: str | None = None
    author_user_id: uuid.UUID | None = None
    parent_comment_id: uuid.UUID | None = None
    content: str
    created_at: datetime
    empathy_count: int = 0
    viewer_has_empathy: bool = False
    replies: list["SharedArticleCommentResponse"] = Field(default_factory=list)


class SharedArticleCommentEmpathyResponse(BaseModel):
    empathy_count: int
    viewer_has_empathy: bool


class SharedArticleEmpathyResponse(BaseModel):
    empathy_count: int
    viewer_has_empathy: bool


SharedArticleCommentResponse.model_rebuild()
