import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ArticleCreate(BaseModel):
    url: str | None = Field(None, max_length=2048)
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    source: str = Field(default="web", pattern="^(web|extension|api)$")


class ArticleAnalyzeURL(BaseModel):
    url: str = Field(..., max_length=2048)
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
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
    created_at: datetime


class ArticleResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    url: str | None = None
    title: str
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
