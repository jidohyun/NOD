import io

from PIL import Image

from src.articles.og_image import (
    IMAGE_HEIGHT,
    IMAGE_WIDTH,
    generate_og_image_from_thumbnail_bytes,
)


def _encode_image(width: int, height: int, color: tuple[int, int, int]) -> bytes:
    image = Image.new("RGB", (width, height), color=color)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_generate_og_image_from_thumbnail_bytes_uses_cover_for_regular_landscape() -> (
    None
):
    source = _encode_image(1920, 1080, (32, 64, 128))

    derived = generate_og_image_from_thumbnail_bytes(source)

    assert derived is not None
    with Image.open(io.BytesIO(derived)) as output:
        assert output.size == (IMAGE_WIDTH, IMAGE_HEIGHT)


def test_generate_og_image_from_thumbnail_bytes_handles_extreme_portrait() -> None:
    source = _encode_image(700, 2200, (128, 32, 64))

    derived = generate_og_image_from_thumbnail_bytes(source)

    assert derived is not None
    with Image.open(io.BytesIO(derived)) as output:
        assert output.size == (IMAGE_WIDTH, IMAGE_HEIGHT)


def test_generate_og_image_from_thumbnail_bytes_rejects_too_small_source() -> None:
    source = _encode_image(200, 200, (16, 16, 16))

    derived = generate_og_image_from_thumbnail_bytes(source)

    assert derived is None
