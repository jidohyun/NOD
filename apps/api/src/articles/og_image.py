"""Generate OG images for shared articles using Pillow."""

from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

IMAGE_WIDTH = 1200
IMAGE_HEIGHT = 630

CONTENT_TYPE_GRADIENTS: dict[str, tuple[tuple[int, int, int], tuple[int, int, int]]] = {
    "tech_blog": ((37, 99, 235), (55, 48, 163)),
    "general_news": ((75, 85, 99), (30, 41, 59)),
    "academic_paper": ((147, 51, 234), (91, 33, 182)),
    "official_docs": ((13, 148, 136), (6, 95, 70)),
    "video_podcast": ((219, 39, 119), (159, 18, 57)),
    "github_repo": ((51, 65, 85), (17, 24, 39)),
}

CONTENT_TYPE_LABELS: dict[str, str] = {
    "tech_blog": "Tech Blog",
    "general_news": "News",
    "academic_paper": "Paper",
    "official_docs": "Docs",
    "video_podcast": "Video",
    "github_repo": "GitHub",
}

DEFAULT_GRADIENT = ((51, 65, 85), (17, 24, 39))


def _get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Try to load Noto Sans KR from system, fall back to default."""
    font_paths = [
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/google-noto-cjk/NotoSansCJKkr-Regular.otf",
        "/usr/share/fonts/noto/NotoSansCJK-Regular.ttc",
    ]
    if bold:
        bold_paths = [
            "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
            "/usr/share/fonts/google-noto-cjk/NotoSansCJKkr-Bold.otf",
            "/usr/share/fonts/noto/NotoSansCJK-Bold.ttc",
        ]
        font_paths = bold_paths + font_paths

    for fp in font_paths:
        if Path(fp).exists():
            return ImageFont.truetype(fp, size)

    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()


def _draw_gradient(
    img: Image.Image,
    color_from: tuple[int, int, int],
    color_to: tuple[int, int, int],
) -> None:
    """Draw a vertical gradient on the image."""
    draw = ImageDraw.Draw(img)
    for y in range(IMAGE_HEIGHT):
        ratio = y / IMAGE_HEIGHT
        r = int(color_from[0] + (color_to[0] - color_from[0]) * ratio)
        g = int(color_from[1] + (color_to[1] - color_from[1]) * ratio)
        b = int(color_from[2] + (color_to[2] - color_from[2]) * ratio)
        draw.line([(0, y), (IMAGE_WIDTH, y)], fill=(r, g, b))


def _truncate_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int,
    max_lines: int,
) -> list[str]:
    """Word-wrap and truncate text to fit within bounds."""
    words = text.replace("\n", " ").split()
    lines: list[str] = []
    current_line = ""

    for word in words:
        test = f"{current_line} {word}".strip() if current_line else word
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line = test
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
            if len(lines) >= max_lines:
                break

    if current_line and len(lines) < max_lines:
        lines.append(current_line)

    if len(lines) == max_lines:
        last = lines[-1]
        bbox = draw.textbbox((0, 0), last + "...", font=font)
        if bbox[2] - bbox[0] > max_width:
            bbox_w = draw.textbbox((0, 0), last + "...", font=font)[2]
            while last and bbox_w > max_width:
                last = last[:-1]
                bbox_w = draw.textbbox(
                    (0, 0), last + "...", font=font
                )[2]
            # skip the duplicate trim below
            lines[-1] = last.rstrip() + "..."
        elif len(words) > sum(
            len(line.split()) for line in lines
        ):
            lines[-1] = last + "..."

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
    gradient = CONTENT_TYPE_GRADIENTS.get(content_type, DEFAULT_GRADIENT)
    label = CONTENT_TYPE_LABELS.get(content_type)
    hostname = _get_host(article_url)

    img = Image.new("RGB", (IMAGE_WIDTH, IMAGE_HEIGHT))
    _draw_gradient(img, gradient[0], gradient[1])
    draw = ImageDraw.Draw(img)

    font_title = _get_font(48, bold=True)
    font_summary = _get_font(22)
    font_badge = _get_font(18, bold=True)
    font_bottom = _get_font(20, bold=True)
    font_domain = _get_font(18)

    white = (255, 255, 255)
    white_75 = (255, 255, 255, 191)
    white_55 = (255, 255, 255, 140)
    white_35 = (255, 255, 255, 89)

    padding_x = 48
    padding_top = 40

    # Badge (top-right)
    if label:
        badge_bbox = draw.textbbox((0, 0), label, font=font_badge)
        badge_w = badge_bbox[2] - badge_bbox[0]
        badge_h = badge_bbox[3] - badge_bbox[1]
        badge_x = IMAGE_WIDTH - padding_x - badge_w - 32
        badge_y = padding_top
        draw.rounded_rectangle(
            [badge_x - 16, badge_y - 6, badge_x + badge_w + 16, badge_y + badge_h + 6],
            radius=9999,
            fill=(255, 255, 255, 38),
        )
        draw.text((badge_x, badge_y), label, fill=white_75, font=font_badge)

    # Title (bottom area)
    max_text_width = IMAGE_WIDTH - padding_x * 2
    title_lines = _truncate_text(draw, title, font_title, max_text_width, 3)
    summary_lines = _truncate_text(draw, summary, font_summary, max_text_width, 4)

    # Calculate positions from bottom
    bottom_bar_y = IMAGE_HEIGHT - 36 - 20
    separator_y = bottom_bar_y - 16

    summary_height = len(summary_lines) * 34
    title_height = len(title_lines) * 58

    summary_y = separator_y - 20 - summary_height
    title_y = summary_y - 16 - title_height

    # Draw title
    for i, line in enumerate(title_lines):
        draw.text((padding_x, title_y + i * 58), line, fill=white, font=font_title)

    # Draw summary
    for i, line in enumerate(summary_lines):
        draw.text(
            (padding_x, summary_y + i * 34),
            line,
            fill=white_55,
            font=font_summary,
        )

    # Separator line
    draw.line(
        [(padding_x, separator_y), (IMAGE_WIDTH - padding_x, separator_y)],
        fill=(255, 255, 255, 25),
        width=2,
    )

    # Bottom bar: NOD + domain
    draw.text((padding_x + 44, bottom_bar_y), "NOD", fill=white_55, font=font_bottom)
    domain_bbox = draw.textbbox((0, 0), hostname, font=font_domain)
    domain_w = domain_bbox[2] - domain_bbox[0]
    draw.text(
        (IMAGE_WIDTH - padding_x - domain_w, bottom_bar_y + 2),
        hostname,
        fill=white_35,
        font=font_domain,
    )

    # Save to bytes
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
