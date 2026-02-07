from pydantic import BaseModel, Field


class ArticleAnalysisResult(BaseModel):
    summary: str = Field(
        description="A concise summary of the article in 2-4 sentences"
    )
    concepts: list[str] = Field(
        description="List of 3-7 key concepts or topics discussed in the article"
    )
    key_points: list[str] = Field(
        description="List of 3-5 main takeaways or key points from the article"
    )
    language: str = Field(
        description="ISO 639-1 language code of the article (e.g., 'en', 'ko', 'ja')"
    )
    reading_time_minutes: int = Field(
        description="Estimated reading time in minutes based on content length and complexity"
    )
