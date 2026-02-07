import { renderWithProviders, screen, within } from '@/test/utils';
import { ArticleCard } from '@/components/articles/article-card';
import type { ArticleListItem } from '@/lib/api/articles';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Factory function to create test article data
function createTestArticle(
  overrides?: Partial<ArticleListItem & { concepts?: string[] }>
): ArticleListItem & { concepts?: string[] } {
  return {
    id: 'test-article-id',
    url: 'https://example.com/article',
    title: 'Test Article Title',
    source: 'web',
    status: 'completed',
    created_at: '2026-02-03T10:00:00Z',
    summary_preview: 'This is a test summary preview of the article.',
    ...overrides,
  };
}

describe('ArticleCard', () => {
  describe('Article Title and Link', () => {
    it('renders article title as a link to article detail page', () => {
      const article = createTestArticle();
      renderWithProviders(<ArticleCard article={article} />);

      const titleLink = screen.getByRole('link', { name: article.title });
      expect(titleLink).toBeInTheDocument();
      expect(titleLink).toHaveAttribute('href', `/articles/${article.id}`);
    });

    it('renders long titles without truncation issues', () => {
      const longTitle =
        'This is a very long article title that should be displayed properly without breaking the layout';
      const article = createTestArticle({ title: longTitle });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByRole('link', { name: longTitle })).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('shows pending status badge', () => {
      const article = createTestArticle({ status: 'pending' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('shows analyzing status badge', () => {
      const article = createTestArticle({ status: 'analyzing' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('analyzing')).toBeInTheDocument();
    });

    it('shows completed status badge', () => {
      const article = createTestArticle({ status: 'completed' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('shows failed status badge', () => {
      const article = createTestArticle({ status: 'failed' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('failed')).toBeInTheDocument();
    });
  });

  describe('Summary Preview', () => {
    it('shows summary preview when available', () => {
      const summaryText = 'This is the article summary preview';
      const article = createTestArticle({ summary_preview: summaryText });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText(summaryText)).toBeInTheDocument();
    });

    it('shows "No summary available" when summary_preview is null', () => {
      const article = createTestArticle({ summary_preview: null });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText(/no summary available/i)).toBeInTheDocument();
    });

    it('shows "No summary available" when summary_preview is empty string', () => {
      const article = createTestArticle({ summary_preview: '' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText(/no summary available/i)).toBeInTheDocument();
    });
  });

  describe('Source Badge', () => {
    it('shows web source badge', () => {
      const article = createTestArticle({ source: 'web' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('web')).toBeInTheDocument();
    });

    it('shows extension source badge', () => {
      const article = createTestArticle({ source: 'extension' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('extension')).toBeInTheDocument();
    });

    it('shows api source badge', () => {
      const article = createTestArticle({ source: 'api' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('api')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('shows formatted date', () => {
      const article = createTestArticle({ created_at: '2026-02-03T10:00:00Z' });
      renderWithProviders(<ArticleCard article={article} />);

      // Look for a date format pattern (e.g., "Feb 3, 2026" or "2026-02-03")
      const dateText = screen.getByText(/feb|2026|02/i);
      expect(dateText).toBeInTheDocument();
    });

    it('handles different date formats correctly', () => {
      const article = createTestArticle({ created_at: '2025-12-25T15:30:00Z' });
      renderWithProviders(<ArticleCard article={article} />);

      const dateText = screen.getByText(/dec|2025|12|25/i);
      expect(dateText).toBeInTheDocument();
    });
  });

  describe('Concept Tags', () => {
    it('shows concept tags when concepts array is provided', () => {
      const concepts = ['React', 'TypeScript', 'Testing'];
      const article = createTestArticle({ concepts });
      renderWithProviders(<ArticleCard article={article} />);

      concepts.forEach((concept) => {
        expect(screen.getByText(concept)).toBeInTheDocument();
      });
    });

    it('shows multiple concept tags correctly', () => {
      const concepts = ['AI', 'Machine Learning', 'Deep Learning', 'Neural Networks'];
      const article = createTestArticle({ concepts });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
      expect(screen.getByText('Deep Learning')).toBeInTheDocument();
      expect(screen.getByText('Neural Networks')).toBeInTheDocument();
    });

    it('does not render concept section when concepts array is empty', () => {
      const article = createTestArticle({ concepts: [] });
      renderWithProviders(<ArticleCard article={article} />);

      // Look for concept-related text or wrapper
      expect(screen.queryByTestId('concepts-section')).not.toBeInTheDocument();
    });

    it('does not render concept section when concepts is undefined', () => {
      const article = createTestArticle({ concepts: undefined });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.queryByTestId('concepts-section')).not.toBeInTheDocument();
    });

    it('renders single concept correctly', () => {
      const article = createTestArticle({ concepts: ['JavaScript'] });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });
  });

  describe('Card Component Structure', () => {
    it('renders using shadcn Card component structure', () => {
      const article = createTestArticle();
      const { container } = renderWithProviders(<ArticleCard article={article} />);

      // Check for card structure (adjust based on actual implementation)
      expect(container.querySelector('[role="article"]')).toBeInTheDocument();
    });

    it('renders all elements within the card', () => {
      const article = createTestArticle({
        concepts: ['React', 'Testing'],
      });
      renderWithProviders(<ArticleCard article={article} />);

      // Verify all key elements are present
      expect(screen.getByRole('link', { name: article.title })).toBeInTheDocument();
      expect(screen.getByText(article.status)).toBeInTheDocument();
      expect(screen.getByText(article.source)).toBeInTheDocument();
      expect(screen.getByText(article.summary_preview!)).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing url gracefully', () => {
      const article = createTestArticle({ url: null });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByRole('link', { name: article.title })).toBeInTheDocument();
    });

    it('handles unknown status values', () => {
      const article = createTestArticle({ status: 'unknown_status' });
      renderWithProviders(<ArticleCard article={article} />);

      expect(screen.getByText('unknown_status')).toBeInTheDocument();
    });

    it('handles empty title string', () => {
      const article = createTestArticle({ title: '' });
      renderWithProviders(<ArticleCard article={article} />);

      // Should still render the link structure
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
