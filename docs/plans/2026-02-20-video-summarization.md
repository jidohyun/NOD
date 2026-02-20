# Video Summarization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable end-to-end video summarization for supported video URLs (starting with YouTube captions) so users can save a video URL and receive a `video_podcast` summary instead of extraction failure.

**Architecture:** Keep the current API-first async analysis flow (`/api/articles/analyze-url` -> API background analysis -> worker embedding task) and add a transcript-ingestion layer before article creation for `video_podcast` URLs when content is empty. Implement provider-based transcript extraction with clear fallback behavior and explicit Pro-gated access rules.

**Tech Stack:** FastAPI (api), Python 3.12, SQLAlchemy, existing agent registry (`VideoPodcastAgent`), Chrome extension (React + TS), `youtube-transcript-api` (new), existing OpenAI SDK for optional transcription fallback.

---

### Task 1: Lock behavior with failing tests (API unit-level)

**Files:**
- Create: `apps/api/tests/test_video_transcript_service.py`
- Create: `apps/api/tests/test_video_analysis_preparation.py`
- Modify: `apps/api/tests/test_content_access_policy.py`

**Step 1: Write failing test for transcript extraction contract**

```python
import pytest

from src.lib.video_transcript.service import prepare_video_content


@pytest.mark.asyncio
async def test_prepare_video_content_uses_transcript_when_body_empty():
    content, metadata = await prepare_video_content(
        url="https://www.youtube.com/watch?v=abc",
        title="Video title",
        content="",
    )
    assert len(content) > 0
    assert metadata["provider"] in {"youtube_captions", "openai_whisper"}
```

**Step 2: Write failing test for unsupported transcript path**

```python
import pytest

from src.lib.video_transcript.service import TranscriptUnavailableError, prepare_video_content


@pytest.mark.asyncio
async def test_prepare_video_content_raises_when_no_transcript_available():
    with pytest.raises(TranscriptUnavailableError):
        await prepare_video_content(
            url="https://open.spotify.com/episode/123",
            title="Podcast",
            content="",
        )
```

**Step 3: Update policy test for current plan gate semantics**

```python
def test_basic_cannot_access_video_podcast():
    assert can_access_content_type("basic", ContentType.VIDEO_PODCAST) is False
```

**Step 4: Run tests to verify RED**

Run: `uv run pytest tests/test_video_transcript_service.py tests/test_video_analysis_preparation.py -v`
Expected: FAIL with missing module/functions.

**Step 5: Commit**

```bash
git add apps/api/tests/test_video_transcript_service.py apps/api/tests/test_video_analysis_preparation.py apps/api/tests/test_content_access_policy.py
git commit -m "test(api): define failing tests for video transcript ingestion"
```

---

### Task 2: Add transcript provider abstraction (API)

**Files:**
- Create: `apps/api/src/lib/video_transcript/base.py`
- Create: `apps/api/src/lib/video_transcript/schemas.py`
- Create: `apps/api/src/lib/video_transcript/__init__.py`
- Test: `apps/api/tests/test_video_transcript_service.py`

**Step 1: Write failing test for provider interface behavior**

```python
from src.lib.video_transcript.schemas import TranscriptResult


def test_transcript_result_has_required_fields():
    result = TranscriptResult(text="hello", provider="youtube_captions", language="en")
    assert result.text == "hello"
```

**Step 2: Run test to verify RED**

Run: `uv run pytest tests/test_video_transcript_service.py::test_transcript_result_has_required_fields -v`
Expected: FAIL due to missing schema module.

**Step 3: Write minimal implementation**

```python
from pydantic import BaseModel


class TranscriptResult(BaseModel):
    text: str
    provider: str
    language: str | None = None
```

**Step 4: Run test to verify GREEN**

Run: `uv run pytest tests/test_video_transcript_service.py::test_transcript_result_has_required_fields -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/src/lib/video_transcript/base.py apps/api/src/lib/video_transcript/schemas.py apps/api/src/lib/video_transcript/__init__.py apps/api/tests/test_video_transcript_service.py
git commit -m "feat(api): add transcript provider abstraction"
```

---

### Task 3: Implement YouTube caption provider (MVP provider)

**Files:**
- Modify: `apps/api/pyproject.toml`
- Create: `apps/api/src/lib/video_transcript/youtube_provider.py`
- Modify: `apps/api/src/lib/config.py`
- Test: `apps/api/tests/test_video_transcript_service.py`

**Step 1: Write failing tests for YouTube URL extraction + transcript fetch contract**

```python
def test_extract_video_id_from_youtube_watch_url():
    assert extract_video_id("https://www.youtube.com/watch?v=abc123") == "abc123"


@pytest.mark.asyncio
async def test_youtube_provider_returns_transcript_text(mocker):
    # mock youtube-transcript-api response
    ...
```

**Step 2: Run test to verify RED**

Run: `uv run pytest tests/test_video_transcript_service.py -k youtube -v`
Expected: FAIL for missing provider helpers.

**Step 3: Write minimal implementation**

```python
class YouTubeTranscriptProvider(TranscriptProvider):
    async def fetch(self, url: str) -> TranscriptResult:
        # parse video ID, run youtube-transcript-api in thread pool,
        # normalize into plain text with timestamps stripped
        ...
```

**Step 4: Add config knobs (no behavior change yet)**

```python
YOUTUBE_TRANSCRIPT_LANG_PRIORITY: list[str] = ["ko", "en", "ja"]
YOUTUBE_TRANSCRIPT_ENABLED: bool = True
```

**Step 5: Run tests to verify GREEN**

Run: `uv run pytest tests/test_video_transcript_service.py -k youtube -v`
Expected: PASS.

**Step 6: Commit**

```bash
git add apps/api/pyproject.toml apps/api/src/lib/config.py apps/api/src/lib/video_transcript/youtube_provider.py apps/api/tests/test_video_transcript_service.py
git commit -m "feat(api): add youtube caption transcript provider"
```

---

### Task 4: Add transcript orchestration service + domain errors

**Files:**
- Create: `apps/api/src/lib/video_transcript/service.py`
- Modify: `apps/api/src/lib/video_transcript/__init__.py`
- Test: `apps/api/tests/test_video_transcript_service.py`

**Step 1: Write failing tests for orchestration behavior**

```python
@pytest.mark.asyncio
async def test_prepare_video_content_returns_existing_content_without_provider_call():
    content, metadata = await prepare_video_content(
        url="https://youtube.com/watch?v=abc",
        title="x",
        content="already extracted transcript",
    )
    assert content == "already extracted transcript"
    assert metadata["source"] == "client"
```

**Step 2: Run tests to verify RED**

Run: `uv run pytest tests/test_video_transcript_service.py -k prepare_video_content -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

```python
class TranscriptUnavailableError(Exception):
    pass


async def prepare_video_content(url: str, title: str, content: str | None) -> tuple[str, dict[str, str]]:
    if content and content.strip():
        return content, {"source": "client"}
    # call youtube provider for youtube domains
    # else raise TranscriptUnavailableError
```

**Step 4: Run tests to verify GREEN**

Run: `uv run pytest tests/test_video_transcript_service.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/src/lib/video_transcript/service.py apps/api/src/lib/video_transcript/__init__.py apps/api/tests/test_video_transcript_service.py
git commit -m "feat(api): add video transcript orchestration service"
```

---

### Task 5: Integrate transcript service into analyze-url pipeline

**Files:**
- Modify: `apps/api/src/articles/router.py`
- Modify: `apps/api/src/articles/schemas.py` (only if response metadata field is needed)
- Test: `apps/api/tests/test_video_analysis_preparation.py`

**Step 1: Write failing tests for router helper behavior**

```python
@pytest.mark.asyncio
async def test_prepare_content_for_video_url_invokes_transcript_service(mocker):
    ...


@pytest.mark.asyncio
async def test_prepare_content_for_video_url_raises_422_when_unavailable(mocker):
    ...
```

**Step 2: Run tests to verify RED**

Run: `uv run pytest tests/test_video_analysis_preparation.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation in router**

```python
requested_content_type = classify_url(data.url)
if requested_content_type == ContentType.VIDEO_PODCAST:
    content, transcript_meta = await prepare_video_content(data.url, title, content)
```

Error mapping:
- transcript unavailable -> `422` with detail like: `"Transcript unavailable for this video URL"`
- provider transient error -> `503` with retryable message

**Step 4: Keep existing non-video behavior unchanged**

- PDF fallback remains for non-video URLs.
- plan gating (`enforce_content_type_access`) stays before expensive work when possible.

**Step 5: Run tests to verify GREEN**

Run: `uv run pytest tests/test_video_analysis_preparation.py tests/test_content_access_policy.py -v`
Expected: PASS.

**Step 6: Commit**

```bash
git add apps/api/src/articles/router.py apps/api/src/articles/schemas.py apps/api/tests/test_video_analysis_preparation.py
git commit -m "feat(api): ingest video transcripts in analyze-url flow"
```

---

### Task 6: Extension ingestion path for YouTube pages (remove hard block)

**Files:**
- Modify: `apps/extension/src/content/extractor.ts`
- Modify: `apps/extension/src/content/content-script.ts`
- Modify: `apps/extension/src/lib/i18n/index.ts`
- Modify: `apps/extension/src/popup/components/StatusMessage.tsx`

**Step 1: Write failing test/spec notes (if extension test harness absent)**

Add test TODO ticket in plan execution:
- `extractor.ts` should treat YouTube watch pages as eligible save targets.
- extraction result for video pages should return minimal payload (`title`, `url`, empty `content`) to trigger backend transcript ingestion.

**Step 2: Run current verification baseline**

Run: `npm run typecheck`
Expected: PASS before edits.

**Step 3: Minimal implementation**

- Remove `youtube.com` from blocked host list.
- Add `isYouTubeWatchPage` helper.
- Return safe placeholder extraction for YouTube if readability is not useful.
- Add localized error text for transcript-unavailable response handling (from API 422 detail).

**Step 4: Verify**

Run: `npm run typecheck`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/extension/src/content/extractor.ts apps/extension/src/content/content-script.ts apps/extension/src/lib/i18n/index.ts apps/extension/src/popup/components/StatusMessage.tsx
git commit -m "feat(extension): allow youtube save flow for backend transcript ingestion"
```

---

### Task 7: Observability, retries, and safeguards

**Files:**
- Modify: `apps/api/src/lib/video_transcript/service.py`
- Modify: `apps/api/src/articles/router.py`
- Test: `apps/api/tests/test_video_transcript_service.py`

**Step 1: Write failing tests for retryable error classification**

```python
def test_transcript_provider_error_is_marked_retryable():
    ...
```

**Step 2: Run RED**

Run: `uv run pytest tests/test_video_transcript_service.py -k retry -v`
Expected: FAIL.

**Step 3: Minimal implementation**

- Add structured logging fields:
  - `content_type`, `transcript_provider`, `transcript_chars`, `transcript_latency_ms`, `transcript_error_type`.
- Add conservative timeout + bounded retries for transcript calls.
- Ensure no raw transcript is logged.

**Step 4: Run GREEN**

Run: `uv run pytest tests/test_video_transcript_service.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/src/lib/video_transcript/service.py apps/api/src/articles/router.py apps/api/tests/test_video_transcript_service.py
git commit -m "chore(api): add transcript retries and observability"
```

---

### Task 8: End-to-end verification and rollout safety

**Files:**
- Modify: `apps/web/src/config/messages/en.json`
- Modify: `apps/web/src/config/messages/ko.json`
- Modify: `apps/web/src/config/messages/ja.json`
- (Optional docs) Create: `docs/plan-docs/video-summarization-runbook.md`

**Step 1: Add user-facing copy for new behavior**

- Add clear retryable guidance for unsupported/no-caption videos.
- Keep Pro gating copy aligned with current policy (`video_podcast` is Pro-only).

**Step 2: Verify API and app checks**

Run:
- `cd apps/api && uv run pytest tests/ -v`
- `cd apps/api && uv run mypy src`
- `cd apps/web && bun run typecheck`
- `cd apps/extension && npm run typecheck`

Expected: PASS, or document pre-existing failures with exact logs.

**Step 3: Smoke test scenarios**

1. Pro user + YouTube with captions -> `processing` then analyzed `video_podcast` summary.
2. Pro user + YouTube without captions -> 422 with transcript-unavailable message.
3. Free user + YouTube -> 402 upgrade message.
4. Existing non-video URLs (news/docs/blog/pdf) unchanged.

**Step 4: Commit**

```bash
git add apps/web/src/config/messages/en.json apps/web/src/config/messages/ko.json apps/web/src/config/messages/ja.json docs/plan-docs/video-summarization-runbook.md
git commit -m "docs: add rollout messaging and runbook for video summarization"
```

---

## MVP Scope vs Follow-up Scope

**MVP (this plan):**
- YouTube caption ingestion via `youtube-transcript-api`.
- API integration into `/api/articles/analyze-url` for `video_podcast` with empty content.
- Extension flow unblocked for YouTube pages by returning minimal payload and delegating transcript extraction to backend.
- Clear error/upgrade UX.

**Follow-up (post-MVP):**
- Podcast audio transcription fallback via OpenAI Whisper API (or Deepgram/AssemblyAI).
- Queue offload for heavy transcript jobs to worker task type (e.g., `transcript`) if API latency budget is exceeded.
- Proxy pool integration for cloud IP-block resilience.
- Transcript caching (Redis) keyed by canonical video ID.

## Risk and rollback

- Feature flag: `YOUTUBE_TRANSCRIPT_ENABLED` (default true in dev, controllable in prod).
- Rollback path: disable transcript ingestion flag to revert to prior behavior without schema rollback.
- Safety: non-video and PDF flows remain unchanged.
