"""Backfill og_image_source_url for existing article summaries.

Usage:
    cd apps/api
    uv run python scripts/backfill_og_images.py
"""

from __future__ import annotations

import asyncio
import re
import sys
from pathlib import Path

import httpx

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_OG_META_FETCH_TIMEOUT = 5.0
_OG_META_MAX_BYTES = 256 * 1024


async def extract_og_image_url(article_url: str) -> str | None:
    """Extract og:image URL from a web page's <head> meta tags."""
    try:
        async with (
            httpx.AsyncClient(
                follow_redirects=True,
                timeout=_OG_META_FETCH_TIMEOUT,
            ) as client,
            client.stream("GET", article_url) as response,
        ):
            if response.status_code != 200:
                return None
            content_type = response.headers.get("content-type", "").lower()
            if "html" not in content_type:
                return None
            chunks: list[bytes] = []
            total = 0
            async for chunk in response.aiter_bytes(chunk_size=8192):
                chunks.append(chunk)
                total += len(chunk)
                if total >= _OG_META_MAX_BYTES:
                    break
        head_html = b"".join(chunks).decode("utf-8", errors="ignore")
    except (httpx.HTTPError, UnicodeDecodeError):
        return None

    match = re.search(
        r'<meta\s[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']',
        head_html,
        re.IGNORECASE,
    )
    if not match:
        match = re.search(
            r'<meta\s[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']',
            head_html,
            re.IGNORECASE,
        )
    if not match:
        return None

    og_url = match.group(1).strip()
    if not og_url:
        return None

    if og_url.startswith("//"):
        og_url = "https:" + og_url
    elif og_url.startswith("/"):
        from urllib.parse import urlparse

        parsed = urlparse(article_url)
        og_url = f"{parsed.scheme}://{parsed.netloc}{og_url}"

    if not og_url.startswith(("http://", "https://")):
        return None

    return og_url


async def main() -> None:
    from sqlalchemy import select, update
    from sqlalchemy.ext.asyncio import AsyncSession

    from src.lib.database import async_session_factory

    async with async_session_factory() as session:
        session: AsyncSession

        # Find all summaries without og_image_source_url that have an article URL
        from src.articles.model import Article, ArticleSummary

        rows = await session.execute(
            select(ArticleSummary.id, ArticleSummary.article_id, Article.url)
            .join(Article, ArticleSummary.article_id == Article.id)
            .where(
                ArticleSummary.og_image_source_url.is_(None),
                Article.url.is_not(None),
                Article.url != "",
            )
        )
        items = rows.all()
        total = len(items)
        print(f"Found {total} summaries to backfill")

        success = 0
        skipped = 0
        failed = 0

        for i, (summary_id, _article_id, article_url) in enumerate(items):
            try:
                og_url = await extract_og_image_url(article_url)
            except Exception as exc:
                print(f"  [{i + 1}/{total}] ERROR {article_url}: {exc}")
                failed += 1
                continue

            if not og_url:
                skipped += 1
                if (i + 1) % 20 == 0:
                    print(f"  [{i + 1}/{total}] skipped (no og:image): {article_url}")
                continue

            await session.execute(
                update(ArticleSummary)
                .where(ArticleSummary.id == summary_id)
                .values(og_image_source_url=og_url)
            )
            success += 1
            print(f"  [{i + 1}/{total}] OK: {article_url} -> {og_url[:80]}...")

        await session.commit()
        print(
            f"\nDone: {success} updated, {skipped} skipped,"
            f" {failed} failed (total {total})"
        )


if __name__ == "__main__":
    asyncio.run(main())
