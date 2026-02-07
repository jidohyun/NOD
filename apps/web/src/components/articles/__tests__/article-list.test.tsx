import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent } from '@/test/utils'
import { ArticleList } from '@/components/articles/article-list'
import { useInfiniteArticles } from '@/lib/api/articles'

// Mock the API hooks
vi.mock('@/lib/api/articles', () => ({
  useInfiniteArticles: vi.fn(),
}))

// Mock ArticleCard to simplify testing
vi.mock('@/components/articles/article-card', () => ({
  ArticleCard: ({ article }: any) => (
    <div data-testid={`article-card-${article.id}`}>{article.title}</div>
  ),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

const mockUseInfiniteArticles = vi.mocked(useInfiniteArticles)

function mockArticlesResponse(articles: any[], hasNextPage = false) {
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
    status: 'success',
  } as any)
}

const mockArticles = [
  {
    id: '1',
    title: 'Test Article 1',
    slug: 'test-article-1',
    status: 'published',
    created_at: '2024-01-01',
  },
  {
    id: '2',
    title: 'Test Article 2',
    slug: 'test-article-2',
    status: 'draft',
    created_at: '2024-01-02',
  },
  {
    id: '3',
    title: 'Test Article 3',
    slug: 'test-article-3',
    status: 'published',
    created_at: '2024-01-03',
  },
]

describe('ArticleList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    it('shows loading state when isLoading is true', () => {
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
        status: 'pending',
      } as any)

      renderWithProviders(<ArticleList />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('shows error message when isError is true', () => {
      mockUseInfiniteArticles.mockReturnValue({
        data: undefined,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch'),
        refetch: vi.fn(),
        isFetching: false,
        status: 'error',
      } as any)

      renderWithProviders(<ArticleList />)

      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('shows empty state when there are no articles', () => {
      mockArticlesResponse([])

      renderWithProviders(<ArticleList />)

      expect(screen.getByText(/no articles/i)).toBeInTheDocument()
    })
  })

  describe('Article rendering', () => {
    it('renders all article cards when data is loaded', () => {
      mockArticlesResponse(mockArticles)

      renderWithProviders(<ArticleList />)

      expect(screen.getByTestId('article-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('article-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('article-card-3')).toBeInTheDocument()
    })

    it('displays article titles in cards', () => {
      mockArticlesResponse(mockArticles)

      renderWithProviders(<ArticleList />)

      expect(screen.getByText('Test Article 1')).toBeInTheDocument()
      expect(screen.getByText('Test Article 2')).toBeInTheDocument()
      expect(screen.getByText('Test Article 3')).toBeInTheDocument()
    })
  })

  describe('Grid/List view toggle', () => {
    it('renders view toggle buttons', () => {
      mockArticlesResponse(mockArticles)

      renderWithProviders(<ArticleList />)

      expect(screen.getByTestId('view-toggle-grid')).toBeInTheDocument()
      expect(screen.getByTestId('view-toggle-list')).toBeInTheDocument()
    })

    it('defaults to grid view', () => {
      mockArticlesResponse(mockArticles)

      renderWithProviders(<ArticleList />)

      const gridToggle = screen.getByTestId('view-toggle-grid')
      expect(gridToggle).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to list view when list toggle is clicked', async () => {
      mockArticlesResponse(mockArticles)
      const user = userEvent.setup()

      renderWithProviders(<ArticleList />)

      const listToggle = screen.getByTestId('view-toggle-list')
      await user.click(listToggle)

      expect(listToggle).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Search input', () => {
    it('renders search input', () => {
      mockArticlesResponse(mockArticles)

      renderWithProviders(<ArticleList />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('allows typing in search input', async () => {
      mockArticlesResponse(mockArticles)
      const user = userEvent.setup()

      renderWithProviders(<ArticleList />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test query')

      expect(searchInput).toHaveValue('test query')
    })
  })

  describe('Status filter', () => {
    it('renders status filter control', () => {
      mockArticlesResponse(mockArticles)

      renderWithProviders(<ArticleList />)

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    })

    it('has status filter options', () => {
      mockArticlesResponse(mockArticles)

      renderWithProviders(<ArticleList />)

      const statusFilter = screen.getByLabelText(/status/i)
      expect(statusFilter).toBeInTheDocument()
    })
  })

  describe('Infinite scroll', () => {
    it('shows load more button when hasNextPage is true', () => {
      mockArticlesResponse(mockArticles, true)

      renderWithProviders(<ArticleList />)

      expect(screen.getByText(/load more/i)).toBeInTheDocument()
    })

    it('does not show load more button when hasNextPage is false', () => {
      mockArticlesResponse(mockArticles, false)

      renderWithProviders(<ArticleList />)

      expect(screen.queryByText(/load more/i)).not.toBeInTheDocument()
    })

    it('calls fetchNextPage when load more is clicked', async () => {
      const mockFetchNextPage = vi.fn()
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
        status: 'success',
      } as any)

      const user = userEvent.setup()
      renderWithProviders(<ArticleList />)

      const loadMoreButton = screen.getByText(/load more/i)
      await user.click(loadMoreButton)

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1)
    })
  })
})
