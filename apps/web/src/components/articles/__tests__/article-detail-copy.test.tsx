import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/utils";
import { ArticleDetail } from "../article-detail";

const mockUseArticle = vi.fn();
const mockClipboardWriteText = vi.fn();
let localStorageState: Record<string, string> = {};

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

describe("ArticleDetail copy markdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageState = {};

    mockUseArticle.mockReturnValue({
      data: {
        id: "article-id",
        user_id: "user-id",
        url: "https://example.com",
        title: "Article title",
        original_title: "Article title",
        source: "web",
        status: "completed",
        created_at: "2026-03-21T00:00:00Z",
        updated_at: null,
        summary: {
          id: "summary-id",
          summary: "Summary text",
          markdown_note: "Some markdown note",
          concepts: ["Concept A"],
          key_points: ["Point A"],
          reading_time_minutes: 2,
          language: "en",
          ai_provider: "gemini",
          ai_model: "gemini-2.0-flash",
          created_at: "2026-03-21T00:00:00Z",
          content_type: "general_news",
          type_metadata: {},
        },
      },
      isLoading: false,
      isError: false,
    });

    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: { writeText: mockClipboardWriteText.mockResolvedValue(undefined) },
      },
      configurable: true,
    });

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => localStorageState[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageState[key] = value;
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
    });
  });

  it("I1: renders copy as markdown button in action area", () => {
    renderWithProviders(<ArticleDetail id="article-id" />);

    expect(screen.getByText("Copy as Markdown")).toBeInTheDocument();
  });

  it("I2: does not render old download markdown button", () => {
    renderWithProviders(<ArticleDetail id="article-id" />);

    expect(screen.queryByText("Download .md")).not.toBeInTheDocument();
  });
});
