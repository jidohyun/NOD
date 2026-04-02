"""Generate OG images for shared articles using Pillow."""

from __future__ import annotations

import io
from pathlib import Path

from PIL import (
    Image,
    ImageDraw,
    ImageFilter,
    ImageFont,
    ImageOps,
    UnidentifiedImageError,
)

IMAGE_WIDTH = 1200
IMAGE_HEIGHT = 630
OG_MIN_SOURCE_WIDTH = 600
OG_MIN_SOURCE_HEIGHT = 315

CONTENT_TYPE_GRADIENTS: dict[str, tuple[tuple[int, int, int], tuple[int, int, int]]] = {
    "tech_blog": ((37, 99, 235), (55, 48, 163)),
    "general_news": ((75, 85, 99), (30, 41, 59)),
    "discussion": ((249, 115, 22), (194, 65, 12)),
    "academic_paper": ((147, 51, 234), (91, 33, 182)),
    "official_docs": ((13, 148, 136), (6, 95, 70)),
    "video_podcast": ((219, 39, 119), (159, 18, 57)),
    "github_repo": ((51, 65, 85), (17, 24, 39)),
}

CONTENT_TYPE_LABELS: dict[str, str] = {
    "tech_blog": "Tech Blog",
    "general_news": "News",
    "discussion": "Discussion",
    "academic_paper": "Paper",
    "official_docs": "Docs",
    "video_podcast": "Video",
    "github_repo": "GitHub",
}

DEFAULT_GRADIENT = ((51, 65, 85), (17, 24, 39))

_FONT_DIRS = [
    "/usr/share/fonts/opentype/noto/",
    "/usr/share/fonts/noto-cjk/",
    "/usr/share/fonts/google-noto-cjk/",
    "/usr/share/fonts/noto/",
]

_FONT_NAMES_REGULAR = [
    "NotoSansCJK-Regular.ttc",
    "NotoSansCJKkr-Regular.otf",
]

_FONT_NAMES_BOLD = [
    "NotoSansCJK-Bold.ttc",
    "NotoSansCJKkr-Bold.otf",
]


def _get_font(
    size: int,
    bold: bool = False,
) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    names = _FONT_NAMES_BOLD if bold else _FONT_NAMES_REGULAR
    for d in _FONT_DIRS:
        for n in names:
            p = Path(d) / n
            if p.exists():
                return ImageFont.truetype(str(p), size)
    # fallback: try regular even when bold requested
    if bold:
        for d in _FONT_DIRS:
            for n in _FONT_NAMES_REGULAR:
                p = Path(d) / n
                if p.exists():
                    return ImageFont.truetype(str(p), size)
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()


def _blend(
    bg: tuple[int, int, int],
    fg: tuple[int, int, int],
    alpha: float,
) -> tuple[int, int, int]:
    """Blend fg over bg with alpha (0..1)."""
    return (
        int(bg[0] * (1 - alpha) + fg[0] * alpha),
        int(bg[1] * (1 - alpha) + fg[1] * alpha),
        int(bg[2] * (1 - alpha) + fg[2] * alpha),
    )


def _gradient_at(
    y: int,
    c0: tuple[int, int, int],
    c1: tuple[int, int, int],
) -> tuple[int, int, int]:
    r = y / IMAGE_HEIGHT
    return (
        int(c0[0] + (c1[0] - c0[0]) * r),
        int(c0[1] + (c1[1] - c0[1]) * r),
        int(c0[2] + (c1[2] - c0[2]) * r),
    )


def _draw_gradient(
    img: Image.Image,
    c0: tuple[int, int, int],
    c1: tuple[int, int, int],
) -> None:
    draw = ImageDraw.Draw(img)
    for y in range(IMAGE_HEIGHT):
        c = _gradient_at(y, c0, c1)
        draw.line([(0, y), (IMAGE_WIDTH, y)], fill=c)


def _wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    max_w: int,
    max_lines: int,
) -> list[str]:
    words = text.replace("\n", " ").split()
    lines: list[str] = []
    cur = ""
    for w in words:
        test = f"{cur} {w}".strip() if cur else w
        bw = draw.textbbox((0, 0), test, font=font)[2]
        if bw <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
            if len(lines) >= max_lines:
                break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    # ellipsis on last line if truncated
    if len(lines) == max_lines:
        total = sum(len(ln.split()) for ln in lines)
        if total < len(words):
            last = lines[-1]
            while last:
                tw = draw.textbbox((0, 0), last + "...", font=font)[2]
                if tw <= max_w:
                    break
                last = last[:-1]
            lines[-1] = last.rstrip() + "..."
    return lines


def _get_host(url: str | None) -> str:
    if not url:
        return "nod-archive.com"
    try:
        from urllib.parse import urlparse

        return urlparse(url).hostname or "nod-archive.com"
    except Exception:
        return "nod-archive.com"


def generate_og_image(
    title: str,
    summary: str,
    content_type: str,
    article_url: str | None = None,
) -> bytes:
    """Generate a 1200x630 OG image as PNG bytes."""
    grad = CONTENT_TYPE_GRADIENTS.get(content_type, DEFAULT_GRADIENT)
    label = CONTENT_TYPE_LABELS.get(content_type)
    hostname = _get_host(article_url)

    img = Image.new("RGB", (IMAGE_WIDTH, IMAGE_HEIGHT))
    _draw_gradient(img, grad[0], grad[1])
    draw = ImageDraw.Draw(img)

    ft = _get_font(52, bold=True)
    fs = _get_font(24)
    fb = _get_font(20, bold=True)
    fn = _get_font(22, bold=True)
    fd = _get_font(20)

    white = (255, 255, 255)
    px = 48
    max_w = IMAGE_WIDTH - px * 2

    # --- Badge (top-right) ---
    if label:
        bb = draw.textbbox((0, 0), label, font=fb)
        bw = bb[2] - bb[0]
        bh = bb[3] - bb[1]
        bx = IMAGE_WIDTH - px - bw - 32
        by = 40
        # semi-transparent pill: blend white 15% over gradient
        bg_color = _gradient_at(by, grad[0], grad[1])
        pill_color = _blend(bg_color, (255, 255, 255), 0.15)
        text_color = _blend(bg_color, (255, 255, 255), 0.75)
        draw.rounded_rectangle(
            [bx - 16, by - 8, bx + bw + 16, by + bh + 8],
            radius=20,
            fill=pill_color,
        )
        draw.text((bx, by), label, fill=text_color, font=fb)

    # --- Text content ---
    title_lines = _wrap_text(draw, title, ft, max_w, 3)
    lh_title = 64
    summary_lines = _wrap_text(draw, summary, fs, max_w, 3)
    lh_sum = 38

    # Bottom-up layout:
    # bar_y: NOD + domain text
    # sep_y: separator line
    # summary block above separator
    # title block above summary
    # everything pushed to bottom with spacer on top
    bar_y = IMAGE_HEIGHT - 44
    sep_y = bar_y - 28
    gap_sum_sep = 20
    gap_title_sum = 24

    sum_block_h = len(summary_lines) * lh_sum
    title_block_h = len(title_lines) * lh_title

    sum_top = sep_y - gap_sum_sep - sum_block_h
    title_top = sum_top - gap_title_sum - title_block_h

    # Ensure title doesn't go above top padding
    min_top = 80
    if title_top < min_top:
        title_top = min_top

    # Draw title
    for i, line in enumerate(title_lines):
        y = title_top + i * lh_title
        draw.text((px, y), line, fill=white, font=ft)

    # Draw summary
    sum_color = _blend(
        _gradient_at(sum_top, grad[0], grad[1]),
        (255, 255, 255),
        0.55,
    )
    for i, line in enumerate(summary_lines):
        y = sum_top + i * lh_sum
        draw.text((px, y), line, fill=sum_color, font=fs)

    # Separator
    sep_color = _blend(
        _gradient_at(sep_y, grad[0], grad[1]),
        (255, 255, 255),
        0.10,
    )
    draw.line(
        [(px, sep_y), (IMAGE_WIDTH - px, sep_y)],
        fill=sep_color,
        width=2,
    )

    # Bottom bar: NOD + domain
    nod_color = _blend(
        _gradient_at(bar_y, grad[0], grad[1]),
        (255, 255, 255),
        0.55,
    )
    draw.text((px, bar_y), "NOD", fill=nod_color, font=fn)
    dom_color = _blend(
        _gradient_at(bar_y, grad[0], grad[1]),
        (255, 255, 255),
        0.35,
    )
    dbb = draw.textbbox((0, 0), hostname, font=fd)
    dw = dbb[2] - dbb[0]
    draw.text(
        (IMAGE_WIDTH - px - dw, bar_y + 2),
        hostname,
        fill=dom_color,
        font=fd,
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def _build_cover_derivative(source: Image.Image) -> Image.Image:
    return ImageOps.fit(
        source,
        (IMAGE_WIDTH, IMAGE_HEIGHT),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )


def _build_contain_derivative(source: Image.Image) -> Image.Image:
    background = ImageOps.fit(
        source,
        (IMAGE_WIDTH, IMAGE_HEIGHT),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    ).filter(ImageFilter.GaussianBlur(24))
    contained = ImageOps.contain(
        source,
        (IMAGE_WIDTH, IMAGE_HEIGHT),
        method=Image.Resampling.LANCZOS,
    )
    x = (IMAGE_WIDTH - contained.width) // 2
    y = (IMAGE_HEIGHT - contained.height) // 2
    background.paste(contained, (x, y))
    return background


def generate_og_image_from_thumbnail_bytes(source_bytes: bytes) -> bytes | None:
    try:
        with Image.open(io.BytesIO(source_bytes)) as loaded:
            source = ImageOps.exif_transpose(loaded).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError):
        return None

    if source.width < OG_MIN_SOURCE_WIDTH or source.height < OG_MIN_SOURCE_HEIGHT:
        return None

    ratio = source.width / source.height
    is_extreme_ratio = ratio < 0.9 or ratio > 2.8
    output = (
        _build_contain_derivative(source)
        if is_extreme_ratio
        else _build_cover_derivative(source)
    )

    buffer = io.BytesIO()
    output.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()
