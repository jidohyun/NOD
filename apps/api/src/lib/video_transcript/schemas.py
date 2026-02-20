from pydantic import BaseModel


class TranscriptSegment(BaseModel):
    text: str
    start: float | None = None
    duration: float | None = None


class VideoTranscript(BaseModel):
    video_id: str
    language: str | None = None
    text: str
    segment_count: int
