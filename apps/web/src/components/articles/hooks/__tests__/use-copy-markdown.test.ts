import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyMarkdown } from "../use-copy-markdown";

const mockTrackEvent = vi.fn();
const mockFormatArticleAsMarkdown = vi.fn(() => "# Mocked Markdown");
vi.mock("@/lib/analytics", () => ({
  AnalyticsEvents: {
    markdownCopied: (...args: unknown[]) => mockTrackEvent(...args),
  },
}));

vi.mock("@/lib/article-export", () => ({
  formatArticleAsMarkdown: (...args: unknown[]) => mockFormatArticleAsMarkdown(...args),
}));

const mockArticle = {
  id: "article-1",
  title: "Test Article",
  url: "https://example.com",
  created_at: "2026-03-30T12:00:00Z",
  summary: {
    summary: "A summary",
    markdown_note: "Some note",
    key_points: ["point 1"],
    concepts: ["React"],
    reading_time_minutes: 3,
    content_type: "tech_blog",
    type_metadata: {},
  },
};

describe("useCopyMarkdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockTrackEvent.mockClear();
    mockFormatArticleAsMarkdown.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("H1: copies markdown to clipboard on success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useCopyMarkdown(mockArticle));

    await act(async () => {
      await result.current.copyMarkdown();
    });

    expect(writeText).toHaveBeenCalledWith("# Mocked Markdown");
    expect(result.current.copyState).toBe("copied");
  });

  it("H2: sets error state when clipboard fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useCopyMarkdown(mockArticle));

    await act(async () => {
      await result.current.copyMarkdown();
    });

    expect(result.current.copyState).toBe("error");
  });

  it("H3: resets copied state after 2 seconds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useCopyMarkdown(mockArticle));

    await act(async () => {
      await result.current.copyMarkdown();
    });

    expect(result.current.copyState).toBe("copied");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copyState).toBe("idle");
  });

  it("H4: resets error state after 2 seconds", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("fail"));
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useCopyMarkdown(mockArticle));

    await act(async () => {
      await result.current.copyMarkdown();
    });

    expect(result.current.copyState).toBe("error");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copyState).toBe("idle");
  });

  it("H5: calls analytics on successful copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useCopyMarkdown(mockArticle));

    await act(async () => {
      await result.current.copyMarkdown();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith("article-1", "tech_blog");
  });

  it("H6: forwards type_metadata into article export formatting", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const discussionArticle = {
      ...mockArticle,
      summary: {
        ...mockArticle.summary,
        content_type: "discussion",
        type_metadata: {
          central_question: "What actually broke the rollout?",
          insider_takeaways: ["Operators noticed rollback signals before dashboards caught up."],
        },
      },
    };

    const { result } = renderHook(() => useCopyMarkdown(discussionArticle));

    await act(async () => {
      await result.current.copyMarkdown();
    });

    expect(mockFormatArticleAsMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({
        content_type: "discussion",
        type_metadata: discussionArticle.summary.type_metadata,
      })
    );
  });
});
