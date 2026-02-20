import io
import re
from dataclasses import dataclass

import httpx
import pypdf
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class PDFExtractResult:
    text: str
    title: str | None = None


async def extract_text_from_pdf_url(
    url: str, *, max_pages: int = 50
) -> PDFExtractResult | None:
    """Download a PDF from *url* and return its text and title.

    Returns ``None`` when extraction fails so the caller can fall back
    to the content supplied by the client.
    """
    try:
        async with httpx.AsyncClient(
            follow_redirects=True, timeout=30.0
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if "pdf" not in content_type and not url.lower().endswith(".pdf"):
                return None

            reader = pypdf.PdfReader(io.BytesIO(response.content))
            pages = reader.pages[:max_pages]
            text = "\n\n".join(
                page.extract_text() or "" for page in pages
            )
            text = text.strip()
            if not text:
                return None

            title = _extract_pdf_title(reader, url)

            # For arXiv, try fetching the real title from the abs page
            arxiv_title = await _fetch_arxiv_title(url, client)
            if arxiv_title:
                title = arxiv_title

            return PDFExtractResult(text=text, title=title)
    except Exception:
        logger.warning("PDF text extraction failed", url=url)
        return None


def _extract_pdf_title(
    reader: pypdf.PdfReader, url: str
) -> str | None:
    """Extract title from PDF metadata."""
    meta = reader.metadata
    if meta and meta.title:
        title = meta.title.strip()
        # Skip generic/useless metadata titles
        if title and not _is_useless_title(title, url):
            return title
    return None


def _is_useless_title(title: str, url: str) -> bool:
    """Check if the PDF metadata title is just a filename or ID."""
    # Pure numeric / arxiv-id-like patterns
    if re.fullmatch(r"[\d.]+v?\d*", title):
        return True
    # Matches the filename from the URL
    filename = url.rstrip("/").split("/")[-1].replace(".pdf", "")
    if title == filename:
        return True
    return len(title) < 3


async def _fetch_arxiv_title(
    url: str, client: httpx.AsyncClient
) -> str | None:
    """If *url* is an arXiv PDF, fetch the paper title from the abs page."""
    match = re.search(r"arxiv\.org/pdf/([\d.]+)", url)
    if not match:
        return None

    paper_id = match.group(1)
    abs_url = f"https://arxiv.org/abs/{paper_id}"
    try:
        resp = await client.get(abs_url, timeout=10.0)
        resp.raise_for_status()
        html = resp.text

        # <meta name="citation_title" content="...">
        meta_match = re.search(
            r'<meta\s+name="citation_title"\s+content="([^"]+)"', html
        )
        if meta_match:
            return meta_match.group(1).strip()

        # Fallback: <title>... </title> (arXiv format: "[id] Title")
        title_match = re.search(r"<title>\[[\d.]+(?:v\d+)?]\s*(.+?)</title>", html)
        if title_match:
            return title_match.group(1).strip()
    except Exception:
        logger.debug("Failed to fetch arXiv title", paper_id=paper_id)

    return None
