import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/utils";
import { ArticleDetail } from "../article-detail";

const mockUseArticle = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/api/articles", () => ({
  useArticle: (...args: unknown[]) => mockUseArticle(...args),
  useDeleteArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateArticleShareLink: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeArticleShareLink: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/analytics", () => ({
  AnalyticsEvents: { markdownCopied: vi.fn() },
}));

describe("ArticleDetail discussion metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
    });

    mockUseArticle.mockReturnValue({
      data: {
        id: "article-id",
        user_id: "user-id",
        url: "https://www.reddit.com/r/programming/comments/abc123/example_thread/",
        title: "Shared title",
        original_title: "Shared title",
        source: "web",
        status: "completed",
        created_at: "2026-04-01T00:00:00Z",
        updated_at: null,
        summary: {
          id: "summary-id",
          summary: "Thread summary",
          markdown_note: "Thread markdown",
          concepts: ["Latency", "Infra"],
          key_points: ["People disagree on caching"],
          reading_time_minutes: 3,
          language: "en",
          ai_provider: "gemini",
          ai_model: "gemini-2.0-flash",
          created_at: "2026-04-01T00:00:00Z",
          content_type: "discussion",
          type_metadata: {
            central_question: "Should we cache aggressively at the edge?",
            insider_takeaways: [
              "Infra teams usually regret caching before fixing invalidation ownership.",
            ],
            disagreement_points: [
              "Some engineers prioritize latency wins while others prioritize correctness.",
            ],
            evidence_signals: ["One team shared a production incident caused by stale edge data."],
          },
        },
      },
      isLoading: false,
      isError: false,
    });
  });

  it("renders discussion-specific metadata blocks", () => {
    renderWithProviders(<ArticleDetail id="article-id" />);

    expect(screen.getByRole("heading", { name: "Discussion Details" })).toBeInTheDocument();
    expect(screen.getByText("Central Question")).toBeInTheDocument();
    expect(screen.getByText("Should we cache aggressively at the edge?")).toBeInTheDocument();
    expect(screen.getByText("Insider Takeaways")).toBeInTheDocument();
    expect(
      screen.getByText("Infra teams usually regret caching before fixing invalidation ownership.")
    ).toBeInTheDocument();
    expect(screen.getByText("Main Disagreements")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Some engineers prioritize latency wins while others prioritize correctness."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Evidence Signals")).toBeInTheDocument();
    expect(
      screen.getByText("One team shared a production incident caused by stale edge data.")
    ).toBeInTheDocument();
  });
});
