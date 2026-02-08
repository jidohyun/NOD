from collections.abc import AsyncIterator
from typing import Any

from google import genai
from google.genai import types

from src.lib.ai.base import AIProvider
from src.lib.config import settings


class GeminiProvider(AIProvider[Any]):
    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self._model = "gemini-2.0-flash"
        self._embedding_model = "text-embedding-004"

    async def analyze_image(self, image_data: bytes | list[bytes]) -> Any:
        raise NotImplementedError("Image analysis not implemented for PoC")

    async def generate_text(self, prompt: str, **kwargs: Any) -> str:
        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(**kwargs) if kwargs else None,
        )
        return response.text or ""

    async def generate_stream(self, prompt: str, **kwargs: Any) -> AsyncIterator[str]:
        response = await self._client.aio.models.generate_content_stream(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(**kwargs) if kwargs else None,
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def generate_structured(
        self, prompt: str, schema: type[Any], **kwargs: Any
    ) -> Any:
        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
                **kwargs,
            ),
        )
        import json

        raw = json.loads(response.text or "{}")
        return schema(**raw)

    async def generate_embedding(self, text: str) -> list[float]:
        response = await self._client.aio.models.embed_content(
            model=self._embedding_model,
            contents=text,
        )
        # Gemini text-embedding-004 outputs 768 dimensions by default
        embeddings = response.embeddings
        if not embeddings or not embeddings[0].values:
            raise ValueError("Gemini returned empty embeddings")
        return list(embeddings[0].values)
