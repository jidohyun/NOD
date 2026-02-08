import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleList } from "@/components/articles/article-list";
import type { ArticleListItem } from "@/lib/api/articles";
import { useInfiniteArticles } from "@/lib/api/articles";
import { renderWithProviders } from "@/test/utils";

const RE_LOADING = /loading/i;
const RE_FAILED_TO_LOAD = /failed to load/i;
const RE_NO_ARTICLES = /no articles/i;
const RE_SEARCH = /search/i;
const RE_STATUS = /status/i;
const RE_LOAD_MORE = /load more/i;

// Mock the API hooks
vi.mock("@/lib/api/articles", () => ({
  useInfiniteArticles: vi.fn(),
}));

// Mock ArticleCard to simplify testing
vi.mock("@/components/articles/article-card", () => ({
  ArticleCard: ({ article }: { article: ArticleListItem }) => (
    <div data-testid={`article-card-${article.id}`}>{article.title}</div>
  ),
}));

// Mock next/link
type NextLinkProps = { children: ReactNode; href: string };
vi.mock("next/link", () => ({
  default: ({ children, href }: NextLinkProps) => <a href={href}>{children}</a>,
}));

const mockUseInfiniteArticles = vi.mocked(useInfiniteArticles);

type InfiniteArticlesResult = ReturnType<typeof useInfiniteArticles>;

function mockArticlesResponse(articles: ArticleListItem[], hasNextPage = false) {
  mockUseInfiniteArticles.mockReturnValue({
    data: {
      pages: [
        {
          data: articles,
          meta: {
            page: 1,
            limit: 20,
            total: articles.length,
            total_pages: 1,
            has_next: hasNextPage,
            has_prev: false,
          },
        },
      ],
      pageParams: [1],
    },
    fetchNextPage: vi.fn(),
    hasNextPage,
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    status: "success",
  } as InfiniteArticlesResult);
}

const mockArticles = [
  {
    id: "1",
    title: "Test Article 1",
    slug: "test-article-1",
    status: "published",
    created_at: "2024-01-01",
  },
  {
    id: "2",
    title: "Test Article 2",
    slug: "test-article-2",
    status: "draft",
    created_at: "2024-01-02",
  },
  {
    id: "3",
    title: "Test Article 3",
    slug: "test-article-3",
    status: "published",
    created_at: "2024-01-03",
  },
];

describe("ArticleList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    it("shows loading state when isLoading is true", () => {
      mockUseInfiniteArticles.mockReturnValue({
        data: undefined,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: true,
        status: "pending",
      } as InfiniteArticlesResult);

      renderWithProviders(<ArticleList />);

      expect(screen.getByText(RE_LOADING)).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("shows error message when isError is true", () => {
      mockUseInfiniteArticles.mockReturnValue({
        data: undefined,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: true,
        error: new Error("Failed to fetch"),
        refetch: vi.fn(),
        isFetching: false,
        status: "error",
      } as InfiniteArticlesResult);

      renderWithProviders(<ArticleList />);

      expect(screen.getByText(RE_FAILED_TO_LOAD)).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("shows empty state when there are no articles", () => {
      mockArticlesResponse([]);

      renderWithProviders(<ArticleList />);

      expect(screen.getByText(RE_NO_ARTICLES)).toBeInTheDocument();
    });
  });

  describe("Article rendering", () => {
    it("renders all article cards when data is loaded", () => {
      mockArticlesResponse(mockArticles);

      renderWithProviders(<ArticleList />);

      expect(screen.getByTestId("article-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("article-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("article-card-3")).toBeInTheDocument();
    });

    it("displays article titles in cards", () => {
      mockArticlesResponse(mockArticles);

      renderWithProviders(<ArticleList />);

      expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      expect(screen.getByText("Test Article 2")).toBeInTheDocument();
      expect(screen.getByText("Test Article 3")).toBeInTheDocument();
    });
  });

  describe("Grid/List view toggle", () => {
    it("renders view toggle buttons", () => {
      mockArticlesResponse(mockArticles);

      renderWithProviders(<ArticleList />);

      expect(screen.getByTestId("view-toggle-grid")).toBeInTheDocument();
      expect(screen.getByTestId("view-toggle-list")).toBeInTheDocument();
    });

    it("defaults to grid view", () => {
      mockArticlesResponse(mockArticles);

      renderWithProviders(<ArticleList />);

      const gridToggle = screen.getByTestId("view-toggle-grid");
      expect(gridToggle).toHaveAttribute("aria-pressed", "true");
    });

    it("switches to list view when list toggle is clicked", async () => {
      mockArticlesResponse(mockArticles);
      const user = userEvent.setup();

      renderWithProviders(<ArticleList />);

      const listToggle = screen.getByTestId("view-toggle-list");
      await user.click(listToggle);

      expect(listToggle).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Search input", () => {
    it("renders search input", () => {
      mockArticlesResponse(mockArticles);

      renderWithProviders(<ArticleList />);

      const searchInput = screen.getByPlaceholderText(RE_SEARCH);
      expect(searchInput).toBeInTheDocument();
    });

    it("allows typing in search input", async () => {
      mockArticlesResponse(mockArticles);
      const user = userEvent.setup();

      renderWithProviders(<ArticleList />);

      const searchInput = screen.getByPlaceholderText(RE_SEARCH);
      await user.type(searchInput, "test query");

      expect(searchInput).toHaveValue("test query");
    });
  });

  describe("Status filter", () => {
    it("renders status filter control", () => {
      mockArticlesResponse(mockArticles);

      renderWithProviders(<ArticleList />);

      expect(screen.getByLabelText(RE_STATUS)).toBeInTheDocument();
    });

    it("has status filter options", () => {
      mockArticlesResponse(mockArticles);

      renderWithProviders(<ArticleList />);

      const statusFilter = screen.getByLabelText(RE_STATUS);
      expect(statusFilter).toBeInTheDocument();
    });
  });

  describe("Infinite scroll", () => {
    it("shows load more button when hasNextPage is true", () => {
      mockArticlesResponse(mockArticles, true);

      renderWithProviders(<ArticleList />);

      expect(screen.getByText(RE_LOAD_MORE)).toBeInTheDocument();
    });

    it("does not show load more button when hasNextPage is false", () => {
      mockArticlesResponse(mockArticles, false);

      renderWithProviders(<ArticleList />);

      expect(screen.queryByText(RE_LOAD_MORE)).not.toBeInTheDocument();
    });

    it("calls fetchNextPage when load more is clicked", async () => {
      const mockFetchNextPage = vi.fn();
      mockUseInfiniteArticles.mockReturnValue({
        data: {
          pages: [
            {
              data: mockArticles,
              meta: {
                page: 1,
                limit: 20,
                total: mockArticles.length,
                total_pages: 2,
                has_next: true,
                has_prev: false,
              },
            },
          ],
          pageParams: [1],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        status: "success",
      } as InfiniteArticlesResult);

      const user = userEvent.setup();
      renderWithProviders(<ArticleList />);

      const loadMoreButton = screen.getByText(RE_LOAD_MORE);
      await user.click(loadMoreButton);

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });
  });
});
