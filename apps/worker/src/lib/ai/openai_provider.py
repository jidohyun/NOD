from collections.abc import AsyncIterator
from typing import Any

from openai import AsyncOpenAI

from src.lib.ai.base import AIProvider
from src.lib.config import settings


class OpenAIProvider(AIProvider[Any]):
    def __init__(self) -> None:
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self._model = "gpt-4o-mini"
        self._embedding_model = "text-embedding-3-small"

    async def analyze_image(self, image_data: bytes | list[bytes]) -> Any:
        raise NotImplementedError

    async def generate_text(self, prompt: str, **kwargs: Any) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            **kwargs,
        )
        return response.choices[0].message.content or ""

    async def generate_stream(self, prompt: str, **kwargs: Any) -> AsyncIterator[str]:
        stream = await self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            **kwargs,
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def generate_structured(
        self, prompt: str, schema: type[Any], **kwargs: Any
    ) -> Any:
        response = await self._client.beta.chat.completions.parse(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            response_format=schema,
            **kwargs,
        )
        parsed = response.choices[0].message.parsed
        if parsed is None:
            raise ValueError("Failed to parse structured response from OpenAI")
        return parsed

    async def generate_embedding(self, text: str) -> list[float]:
        response = await self._client.embeddings.create(
            model=self._embedding_model,
            input=text,
            dimensions=768,
        )
        return response.data[0].embedding
