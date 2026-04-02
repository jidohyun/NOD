# YouTube summary failure for Pro users — root cause review

## Conclusion

The strongest repo-backed root cause is a **URL-shape mismatch for YouTube Live links**.

- The extension treats `youtube.com/live/...` as a supported YouTube video page and sends it to the API as a YouTube save/analyze request.
- The API classifies all YouTube hosts as `video_podcast`, so **Pro users pass the plan gate** and reach transcript extraction.
- The transcript extractor only parses `watch?v=...`, `youtu.be/...`, and `/shorts/...` URLs; it does **not** parse `/live/...` URLs.
- That mismatch causes `UnsupportedVideoUrlError`, which the API converts into a `422 Could not extract transcript from this video URL` response.
- Free users do not reach this broken path because the content-type gate blocks `video_podcast` earlier, so the defect is disproportionately visible to **Pro users**.

## Evidence

### 1) Extension accepts YouTube Live pages as valid video pages

- `apps/extension/src/content/extractor.ts:359-378`
  - `isYouTubeVideoPage(...)` returns `true` for:
    - `youtu.be/...`
    - `youtube.com/watch?v=...`
    - `/shorts/...`
    - `/live/...`

### 2) Extension sends empty body for YouTube and relies on server-side transcript extraction

- `apps/extension/src/content/extractor.ts:514-529`
  - `extractYouTubeContent()` sends `content: ""`.
  - This means the backend must successfully extract a transcript for the save/analyze flow to work.

### 3) API marks YouTube as premium video content

- `apps/api/src/lib/content_classifier.py:39-49`
  - `youtube.com` / `youtu.be` are classified as `ContentType.VIDEO_PODCAST`.
- `apps/api/src/subscriptions/service.py:230-238`
  - `can_access_content_type(...)` allows all content types for `plan == "pro"`.
- `apps/api/tests/test_content_access_policy.py:18-25`
  - Test coverage confirms `basic` cannot access `VIDEO_PODCAST`, while `pro` can.

### 4) Transcript extraction does not support `/live/...` URLs

- `apps/api/src/lib/video_transcript/provider.py:42-59`
  - `extract_youtube_video_id(...)` supports:
    - `youtu.be/<id>`
    - `youtube.com?...v=<id>`
    - `/shorts/<id>`
  - It does **not** parse `/live/<id>`.
- `apps/api/src/lib/video_transcript/service.py:52-54`
  - Missing video id raises `UnsupportedVideoUrlError`.
- `apps/api/src/articles/router.py:133-145`
  - Video transcript failures are mapped to HTTP `422` with detail:
    - `Could not extract transcript from this video URL`

### 5) Current tests miss this URL mismatch

- `apps/api/tests/test_video_transcript_service.py:63-91`
  - Existing transcript tests cover `watch?v=` and `youtu.be`.
  - No `/live/...` coverage exists.
- `apps/extension/src/content/extractor.ts:359-378`
  - The client-side `/live/...` support also lacks matching transcript parser coverage.

## Reproduction note

A direct repo-local check confirms the mismatch:

- `classify_url("https://www.youtube.com/live/abc123") == video_podcast`
- `extract_youtube_video_id("https://www.youtube.com/live/abc123") == None`

So the request is treated as valid premium video content, but the transcript path cannot derive the video id.

## Why this shows up as a Pro-user issue

This is **not primarily an entitlement bug**.

The entitlement path works as written:
- Free users are blocked before transcript extraction for `video_podcast` content.
- Pro users get past the gate and are the first users who hit the unsupported `/live/...` transcript path.

That makes the bug appear to be “YouTube summaries do not work for Pro users,” even though the actual defect is a supported-URL mismatch inside the YouTube transcript flow.

## Secondary observation

There is also a broader product limitation: the video flow only works when transcript extraction succeeds. The extension sends no fallback body for YouTube (`content: ""`), so unsupported URL shapes or unavailable captions both fail hard on the server path.

## Recommended follow-up

1. Extend `extract_youtube_video_id(...)` to support `/live/<id>` URLs.
2. Add regression tests for `/live/...` in both transcript parsing and end-to-end video preparation.
3. Consider normalizing supported YouTube URL shapes in one shared place so the extension and API cannot drift again.
4. Improve the user-facing error message for transcript URL-shape failures so it distinguishes unsupported YouTube URL formats from missing captions/provider outages.
