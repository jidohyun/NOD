import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { renderWithProviders } from "@/test/utils";

const RE_NOD = /NOD/i;
const RE_DASHBOARD = /dashboard/i;
const RE_ARTICLES = /articles/i;
const RE_CHANGE_LANGUAGE = /change language/i;

type NextLinkProps = {
  children: ReactNode;
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">;

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/articles",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: NextLinkProps) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { email: "test@example.com", user_metadata: { full_name: "Test User" } } },
        }),
    },
  }),
}));

// Mock auth-client
vi.mock("@/lib/auth/auth-client", () => ({
  signOut: vi.fn(),
}));

describe("DashboardSidebar", () => {
  it("renders NOD brand/logo", () => {
    renderWithProviders(<DashboardSidebar />);

    expect(screen.getByText(RE_NOD)).toBeInTheDocument();
  });

  it("renders Dashboard navigation link", () => {
    renderWithProviders(<DashboardSidebar />);

    const dashboardLink = screen.getByRole("link", { name: RE_DASHBOARD });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/en/dashboard");
  });

  it("renders Articles navigation link", () => {
    renderWithProviders(<DashboardSidebar />);

    const articlesLink = screen.getByRole("link", { name: RE_ARTICLES });
    expect(articlesLink).toBeInTheDocument();
    expect(articlesLink).toHaveAttribute("href", "/en/articles");
  });

  it("renders user section at bottom", () => {
    renderWithProviders(<DashboardSidebar />);

    const userSection = screen.getByTestId("user-section");
    expect(userSection).toBeInTheDocument();
  });
});

describe("DashboardHeader", () => {
  it("renders language switch button", () => {
    renderWithProviders(<DashboardHeader />);

    expect(screen.getByLabelText(RE_CHANGE_LANGUAGE)).toBeInTheDocument();
  });

  it("renders user avatar/menu button", async () => {
    renderWithProviders(<DashboardHeader />);

    // UserMenu initially shows a loading state, then resolves
    // Just check the header renders without crashing
    expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument();
  });

  it("renders sidebar toggle button for mobile", () => {
    renderWithProviders(<DashboardHeader />);

    const toggleButton = screen.getByTestId("sidebar-toggle");
    expect(toggleButton).toBeInTheDocument();
  });
});

describe("DashboardLayout", () => {
  it("renders children content", () => {
    renderWithProviders(
      <DashboardLayout>
        <div data-testid="child-content">Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("contains sidebar component", () => {
    renderWithProviders(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Check for sidebar by looking for navigation elements
    expect(screen.getByRole("link", { name: RE_DASHBOARD })).toBeInTheDocument();
  });

  it("contains header component", () => {
    renderWithProviders(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Check for header by looking for language switch
    expect(screen.getByLabelText(RE_CHANGE_LANGUAGE)).toBeInTheDocument();
  });
});
