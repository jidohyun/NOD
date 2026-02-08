from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any


class AIProvider[T](ABC):
    @abstractmethod
    async def analyze_image(self, image_data: bytes | list[bytes]) -> T:
        pass

    @abstractmethod
    async def generate_text(self, prompt: str, **kwargs: Any) -> str:
        pass

    @abstractmethod
    def generate_stream(self, prompt: str, **kwargs: Any) -> AsyncIterator[str]:
        pass

    @abstractmethod
    async def generate_structured(
        self, prompt: str, schema: type[T], **kwargs: Any
    ) -> T:
        pass

    @abstractmethod
    async def generate_embedding(self, text: str) -> list[float]:
        pass
