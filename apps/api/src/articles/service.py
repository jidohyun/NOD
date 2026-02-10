import uuid
from collections import Counter
from itertools import combinations

from sqlalchemy import String, cast, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.articles.model import Article, ArticleEmbedding, ArticleSummary
from src.articles.schemas import (
    ArticleCreate,
    ArticleListResponse,
    ConceptGraphEdge,
    ConceptGraphMeta,
    ConceptGraphNode,
    ConceptGraphResponse,
    SimilarArticleResponse,
)
from src.common.models.pagination import PaginatedResponse


async def create_article(
    db: AsyncSession,
    user_id: str,
    data: ArticleCreate,
) -> Article:
    article = Article(
        user_id=uuid.UUID(user_id),
        url=data.url,
        title=data.title,
        content=data.content,
        source=data.source,
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


async def list_articles(
    db: AsyncSession,
    user_id: str,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    status_filter: str | None = None,
) -> PaginatedResponse[ArticleListResponse]:
    base_query = select(Article).where(Article.user_id == uuid.UUID(user_id))

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
    if status_filter:
        base_query = base_query.where(Article.status == status_filter)

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
        )
        for a in articles
    ]

    return PaginatedResponse.create(
        data=items,
        total=total,
        page=page,
        limit=limit,
    )


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


def _normalize_concept(value: str) -> str:
    return " ".join(value.split()).strip().casefold()


async def get_concept_graph(
    db: AsyncSession,
    user_id: str,
    max_nodes: int = 1000,
) -> ConceptGraphResponse:
    rows = await db.execute(
        select(ArticleSummary.concepts)
        .join(Article, ArticleSummary.article_id == Article.id)
        .where(
            Article.user_id == uuid.UUID(user_id),
            Article.status.in_(["analyzed", "completed"]),
        )
    )
    concepts_per_article = rows.scalars().all()

    concept_counts: Counter[str] = Counter()
    concept_labels: dict[str, Counter[str]] = {}
    article_concept_sets: list[set[str]] = []

    for concepts in concepts_per_article:
        if not isinstance(concepts, list):
            continue

        normalized_in_article: set[str] = set()
        for raw in concepts:
            if not isinstance(raw, str):
                continue
            label = " ".join(raw.split()).strip()
            if not label:
                continue

            normalized = _normalize_concept(label)
            if not normalized:
                continue

            concept_counts[normalized] += 1
            label_counter = concept_labels.setdefault(normalized, Counter())
            label_counter[label] += 1
            normalized_in_article.add(normalized)

        if normalized_in_article:
            article_concept_sets.append(normalized_in_article)

    selected_norms = [
        concept for concept, _count in concept_counts.most_common(max_nodes)
    ]
    selected_set = set(selected_norms)

    nodes: list[ConceptGraphNode] = []
    for norm in selected_norms:
        label_counts = concept_labels.get(norm)
        if not label_counts:
            continue
        label = label_counts.most_common(1)[0][0]
        nodes.append(ConceptGraphNode(id=norm, label=label, value=concept_counts[norm]))

    edge_counts: Counter[tuple[str, str]] = Counter()
    for concept_set in article_concept_sets:
        filtered = sorted(concept for concept in concept_set if concept in selected_set)
        if len(filtered) < 2:
            continue
        for left, right in combinations(filtered, 2):
            edge_counts[(left, right)] += 1

    edges = [
        ConceptGraphEdge(source=source, target=target, weight=weight)
        for (source, target), weight in edge_counts.items()
    ]
    edges.sort(key=lambda edge: edge.weight, reverse=True)

    return ConceptGraphResponse(
        nodes=nodes,
        edges=edges,
        meta=ConceptGraphMeta(
            total_articles=len(article_concept_sets),
            total_unique_concepts=len(concept_counts),
            returned_nodes=len(nodes),
            returned_edges=len(edges),
            max_nodes=max_nodes,
        ),
    )
