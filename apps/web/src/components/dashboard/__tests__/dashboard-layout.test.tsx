import { renderWithProviders, screen, within } from '@/test/utils'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/articles',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('DashboardSidebar', () => {
  it('renders NOD brand/logo', () => {
    renderWithProviders(<DashboardSidebar />)

    expect(screen.getByText(/NOD/i)).toBeInTheDocument()
  })

  it('renders Dashboard navigation link', () => {
    renderWithProviders(<DashboardSidebar />)

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink).toHaveAttribute('href', '/articles')
  })

  it('renders All Articles navigation link', () => {
    renderWithProviders(<DashboardSidebar />)

    const articlesLink = screen.getByRole('link', { name: /all articles/i })
    expect(articlesLink).toBeInTheDocument()
    expect(articlesLink).toHaveAttribute('href', '/articles')
  })

  it('renders user section at bottom', () => {
    renderWithProviders(<DashboardSidebar />)

    const userSection = screen.getByTestId('user-section')
    expect(userSection).toBeInTheDocument()
  })
})

describe('DashboardHeader', () => {
  it('renders search input placeholder', () => {
    renderWithProviders(<DashboardHeader />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('renders user avatar/menu button', () => {
    renderWithProviders(<DashboardHeader />)

    const userMenu = screen.getByTestId('user-menu')
    expect(userMenu).toBeInTheDocument()
  })

  it('renders sidebar toggle button for mobile', () => {
    renderWithProviders(<DashboardHeader />)

    const toggleButton = screen.getByTestId('sidebar-toggle')
    expect(toggleButton).toBeInTheDocument()
  })
})

describe('DashboardLayout', () => {
  it('renders children content', () => {
    renderWithProviders(
      <DashboardLayout>
        <div data-testid="child-content">Test Content</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('contains sidebar component', () => {
    renderWithProviders(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )

    // Check for sidebar by looking for navigation elements
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('contains header component', () => {
    renderWithProviders(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )

    // Check for header by looking for search input
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})
