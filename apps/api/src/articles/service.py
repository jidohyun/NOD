import difflib
import re
import unicodedata
import uuid
from collections import Counter

from sqlalchemy import String, cast, delete, func, or_, select, true, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

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

VALID_ARTICLE_STATUSES = {
    "pending",
    "processing",
    "analyzed",
    "failed",
    "completed",
}


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
