import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SharedArticleView } from "@/components/articles/shared-article-view";
import { renderWithProviders } from "@/test/utils";

const RE_DELETE = /^Delete$/i;
const RE_SIGN_IN = /sign in/i;
const RE_SIGN_UP = /sign up/i;
const RE_DASHBOARD = /dashboard/i;
const RE_SHARER_OWNER = /nod owner/i;
const RE_SHARER_FALLBACK = /nod user/i;
const RE_VIEW_ORIGINAL = /view original/i;
const RE_VIEWER_NAME = /viewer/i;
const RE_SUMMARY_LABEL = /^summary$/i;
const RE_NOTE_LABEL = /^note$/i;
const RE_TYPE_NEWS = /^news$/i;
const RE_CONCEPTS_HEADING = /concepts/i;
const RE_RESPONSES_TITLE = /^responses \(0\)$/i;
const RE_ADD_COMMENT = /^add comment$/i;
const RE_NO_COMMENTS = /no comments yet/i;
const RE_SIGN_IN_REQUIRED = /sign in to leave a comment/i;
const RE_EMPATHY = /^empathy$/i;
const RE_QUICK_COMMENTS = /^comments$/i;
const RE_SHARE = /^share$/i;
const RE_COMMENTS_HEADING = /^comments$/i;
const RE_KEY_POINTS = /key points/i;
const RE_LEAVE_REACTION = /leave your reaction/i;
const RE_HIDE_REPLIES = /hide replies/i;
const RE_GUEST_AUTHOR = /guest author/i;
const RE_SORT_BY = /^sort by$/i;
const RE_REPORT = /report/i;

const mockUseSharedArticle = vi.fn();
const mockUseSharedArticleByUsername = vi.fn();
const mockUseSharedArticleComments = vi.fn();
const mockUseCreateSharedArticleComment = vi.fn();
const mockUseUpdateSharedArticleComment = vi.fn();
const mockUseDeleteSharedArticleComment = vi.fn();
const mockUseToggleSharedArticleEmpathy = vi.fn();
const mockUseToggleSharedArticleCommentEmpathy = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("@/lib/api/articles", () => ({
  useSharedArticle: (...args: unknown[]) => mockUseSharedArticle(...args),
  useSharedArticleByUsername: (...args: unknown[]) => mockUseSharedArticleByUsername(...args),
  useSharedArticleComments: (...args: unknown[]) => mockUseSharedArticleComments(...args),
  useCreateSharedArticleComment: (...args: unknown[]) => mockUseCreateSharedArticleComment(...args),
  useUpdateSharedArticleComment: (...args: unknown[]) => mockUseUpdateSharedArticleComment(...args),
  useDeleteSharedArticleComment: (...args: unknown[]) => mockUseDeleteSharedArticleComment(...args),
  useToggleSharedArticleEmpathy: (...args: unknown[]) => mockUseToggleSharedArticleEmpathy(...args),
  useToggleSharedArticleCommentEmpathy: (...args: unknown[]) =>
    mockUseToggleSharedArticleCommentEmpathy(...args),
}));

vi.mock("@/lib/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/share/shared-title-share-id",
}));

vi.mock("@/lib/auth/auth-client", () => ({
  getSupabase: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Toggle theme" type="button" />,
}));

describe("SharedArticleView", () => {
  const defaultSharedData = {
    share_id: "share-id",
    share_slug: "shared-title-share-id",
    share_sid: "abcd1234efgh",
    canonical_share_path: "/share/shared-title-share-id",
    article_id: "article-id",
    title: "Shared title",
    source: "web",
    url: "https://example.com",
    created_at: "2026-03-21T00:00:00Z",
    summary: "Shared summary",
    markdown_note: "# Full Summary\n\nDetailed markdown note",
    key_points: ["Point A", "Point B"],
    concepts: ["Concept A"],
    reading_time_minutes: 3,
    language: "en",
    content_type: "general_news",
    type_metadata: {},
    sharer: {
      name: "NOD Owner",
      image: "https://example.com/avatar.png",
    },
    empathy_count: 0,
    viewer_has_empathy: false,
  };

  beforeEach(() => {
    mockUseSharedArticleByUsername.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
    mockGetUser.mockResolvedValue({
      data: {
        user: null,
      },
    });
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
    mockUseSharedArticleComments.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseCreateSharedArticleComment.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseUpdateSharedArticleComment.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseDeleteSharedArticleComment.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseToggleSharedArticleEmpathy.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ empathy_count: 1, viewer_has_empathy: true }),
      isPending: false,
    });
    mockUseToggleSharedArticleCommentEmpathy.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ empathy_count: 1, viewer_has_empathy: true }),
      isPending: false,
    });
  });

  async function waitForAuthToResolve() {
    expect((await screen.findAllByRole("link", { name: RE_SIGN_IN })).length).toBeGreaterThan(0);
  }

  it("renders shared summary in read-only mode", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    const topHeader = screen.getByRole("banner");

    expect(topHeader.className).toContain("fixed");
    expect(topHeader.className).toContain("h-14");
    expect(screen.getByRole("heading", { name: "Shared title" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText(RE_TYPE_NEWS)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: RE_SUMMARY_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: RE_NOTE_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: RE_CONCEPTS_HEADING })).not.toBeInTheDocument();
    const hero = screen.getByTestId("shared-title-hero");
    const heroActions = within(hero).getByTestId("shared-title-hero-left-actions");
    expect(within(heroActions).getByRole("button", { name: RE_EMPATHY })).toBeInTheDocument();
    expect(
      within(heroActions).getByRole("button", { name: RE_QUICK_COMMENTS })
    ).toBeInTheDocument();
    expect(within(heroActions).getByRole("button", { name: RE_SHARE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: RE_RESPONSES_TITLE })).not.toBeInTheDocument();
    expect(screen.getByText("Shared summary")).toBeInTheDocument();
    expect(screen.getByText("Full Summary")).toBeInTheDocument();
    expect(screen.getByText("Point A")).toBeInTheDocument();
    expect(screen.getByText("Concept A")).toBeInTheDocument();
    expect(screen.getByText("NOD Owner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: RE_SHARER_OWNER })).toBeInTheDocument();
    const signInLinks = await screen.findAllByRole("link", { name: RE_SIGN_IN });
    const signUpLinks = screen.getAllByRole("link", { name: RE_SIGN_UP });

    expect(
      signInLinks.some((link) => link.getAttribute("href")?.includes("/login?redirect="))
    ).toBe(true);
    expect(
      signUpLinks.some((link) => link.getAttribute("href")?.includes("/signup?redirect="))
    ).toBe(true);
    expect(screen.getByRole("link", { name: RE_VIEW_ORIGINAL })).toHaveAttribute(
      "href",
      "https://example.com"
    );
    expect(screen.queryByText(RE_DELETE)).not.toBeInTheDocument();
  });

  it("opens comments side panel in read-only mode and shows sign-in prompt", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const hero = screen.getByTestId("shared-title-hero");
    const leftActions = within(hero).getByTestId("shared-title-hero-left-actions");

    fireEvent.click(within(leftActions).getByRole("button", { name: RE_QUICK_COMMENTS }));

    expect(await screen.findByRole("heading", { name: RE_RESPONSES_TITLE })).toBeInTheDocument();
    expect(screen.getAllByText(RE_NO_COMMENTS).length).toBeGreaterThan(0);
    expect(screen.getAllByText(RE_SIGN_IN_REQUIRED).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: RE_ADD_COMMENT })).not.toBeInTheDocument();
  });

  it("updates empathy count from server response when empathy button is clicked", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });
    const mutateAsync = vi
      .fn()
      .mockResolvedValueOnce({ empathy_count: 1, viewer_has_empathy: true })
      .mockResolvedValueOnce({ empathy_count: 0, viewer_has_empathy: false });
    mockUseToggleSharedArticleEmpathy.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    expect((await screen.findAllByText("Viewer")).length).toBeGreaterThan(0);

    const hero = screen.getByTestId("shared-title-hero");
    const leftActions = within(hero).getByTestId("shared-title-hero-left-actions");
    const empathyButton = within(leftActions).getByRole("button", { name: RE_EMPATHY });

    expect(within(empathyButton).getByText("0")).toBeInTheDocument();
    fireEvent.click(empathyButton);
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
      expect(within(empathyButton).getByText("1")).toBeInTheDocument();
    });
    fireEvent.click(empathyButton);
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(2);
      expect(within(empathyButton).getByText("0")).toBeInTheDocument();
    });
  });

  it("increments empathy by one per click in strict mode", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });
    const mutateAsync = vi.fn().mockResolvedValue({ empathy_count: 1, viewer_has_empathy: true });
    mockUseToggleSharedArticleEmpathy.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <StrictMode>
        <SharedArticleView shareId="share-id" token="token-value" />
      </StrictMode>
    );

    expect((await screen.findAllByText("Viewer")).length).toBeGreaterThan(0);

    const hero = screen.getByTestId("shared-title-hero");
    const leftActions = within(hero).getByTestId("shared-title-hero-left-actions");
    const empathyButton = within(leftActions).getByRole("button", { name: RE_EMPATHY });

    fireEvent.click(empathyButton);
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
      expect(within(empathyButton).getByText("1")).toBeInTheDocument();
    });
  });

  it("renders divider and inline comments section below key points", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const keyPointsHeading = screen.getByRole("heading", { name: RE_KEY_POINTS });
    const inlineCommentsHeading = screen.getByRole("heading", { name: RE_COMMENTS_HEADING });
    const divider = screen.getByTestId("shared-closing-separator");

    expect(
      (keyPointsHeading.compareDocumentPosition(divider) & Node.DOCUMENT_POSITION_FOLLOWING) > 0
    ).toBe(true);
    expect(
      (divider.compareDocumentPosition(inlineCommentsHeading) & Node.DOCUMENT_POSITION_FOLLOWING) >
        0
    ).toBe(true);
    expect(screen.getByText(RE_NO_COMMENTS)).toBeInTheDocument();
  });

  it("renders share quick action as a menu trigger", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const hero = screen.getByTestId("shared-title-hero");
    const leftActions = within(hero).getByTestId("shared-title-hero-left-actions");
    const shareButton = within(leftActions).getByRole("button", { name: RE_SHARE });
    expect(shareButton).toHaveAttribute("aria-haspopup", "menu");
    expect(shareButton).toHaveAttribute("aria-expanded", "false");
  });

  it("renders quick actions again at the bottom of the article", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const hero = screen.getByTestId("shared-title-hero");
    const footerQuickActions = screen.getByTestId("shared-footer-quick-actions");

    expect(
      (hero.compareDocumentPosition(footerQuickActions) & Node.DOCUMENT_POSITION_FOLLOWING) > 0
    ).toBe(true);

    expect(
      within(footerQuickActions).getByRole("button", { name: RE_EMPATHY })
    ).toBeInTheDocument();
    expect(
      within(footerQuickActions).getByRole("button", { name: RE_QUICK_COMMENTS })
    ).toBeInTheDocument();
    expect(within(footerQuickActions).getByRole("button", { name: RE_SHARE })).toBeInTheDocument();
  });

  it("shows login/signup CTA with redirect back to shared page", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: {
        ...defaultSharedData,
        key_points: ["Point A"],
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    const loginLinks = await screen.findAllByRole("link", { name: RE_SIGN_IN });
    const signupLinks = screen.getAllByRole("link", { name: RE_SIGN_UP });
    const loginLink = loginLinks.find((link) =>
      link.getAttribute("href")?.includes("/login?redirect=")
    );
    const signupLink = signupLinks.find((link) =>
      link.getAttribute("href")?.includes("/signup?redirect=")
    );

    expect(loginLink).toBeDefined();
    expect(signupLink).toBeDefined();

    expect(loginLink).toHaveAttribute(
      "href",
      "/login?redirect=%2Fshare%2Fshared-title-share-id%3Ftoken%3Dtoken-value"
    );
    expect(signupLink).toHaveAttribute(
      "href",
      "/signup?redirect=%2Fshare%2Fshared-title-share-id%3Ftoken%3Dtoken-value"
    );
  });

  it("shows viewer identity in header when signed in", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
            avatar_url: "https://example.com/viewer.png",
          },
        },
      },
    });

    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    expect((await screen.findAllByRole("img", { name: RE_VIEWER_NAME })).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Viewer").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: RE_DASHBOARD }).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("link", { name: RE_SIGN_UP })).not.toBeInTheDocument();
  });

  it("uses fallback identity when sharer profile is missing", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: {
        ...defaultSharedData,
        sharer: {
          name: null,
          image: null,
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    expect(await screen.findByText("NOD User")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: RE_SHARER_FALLBACK })).toBeInTheDocument();
  });

  it("places author in title section and moves summary below concepts", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const titleHeading = screen.getByRole("heading", { name: "Shared title" });
    const titleSection = titleHeading.closest("section");
    const conceptBadge = screen.getByText("Concept A");
    const conceptsSection = conceptBadge.closest("section");
    const summaryText = screen.getByText("Shared summary");
    const summarySection = summaryText.closest("section");

    expect(titleSection).not.toBeNull();
    expect(conceptsSection).not.toBeNull();
    expect(summarySection).not.toBeNull();
    expect(within(titleSection as HTMLElement).getByText("NOD Owner")).toBeInTheDocument();
    expect(conceptsSection).toBe(titleSection);
    expect(
      within(titleSection as HTMLElement).queryByText("Shared summary")
    ).not.toBeInTheDocument();
    expect(
      ((titleSection as HTMLElement).compareDocumentPosition(summarySection as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING) >
        0
    ).toBe(true);
  });

  it("renders title hero with explicit badge-meta-actions hierarchy", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const hero = screen.getByTestId("shared-title-hero");
    const heroTop = within(hero).getByTestId("shared-title-hero-top");
    const heroMeta = within(hero).getByTestId("shared-title-hero-meta");
    const originRow = within(hero).getByTestId("shared-title-origin-link-row");
    const quickActions = within(hero).getByTestId("shared-title-hero-quick-actions");
    const leftActions = within(hero).getByTestId("shared-title-hero-left-actions");

    expect(within(heroTop).getByText(RE_TYPE_NEWS)).toBeInTheDocument();
    expect(within(heroTop).queryByText("0")).not.toBeInTheDocument();
    expect(within(hero).getByRole("heading", { name: "Shared title" })).toBeInTheDocument();
    expect(within(heroMeta).getByText("NOD Owner")).toBeInTheDocument();
    expect(
      within(heroMeta).queryByRole("link", { name: RE_VIEW_ORIGINAL })
    ).not.toBeInTheDocument();
    expect(within(originRow).getByRole("link", { name: RE_VIEW_ORIGINAL })).toBeInTheDocument();
    expect(within(quickActions).queryByTestId("shared-title-hero-actions")).not.toBeInTheDocument();
    expect(leftActions.className).not.toContain("border");
    expect(within(leftActions).getByRole("button", { name: RE_EMPATHY })).toBeInTheDocument();
    expect(
      within(leftActions).getByRole("button", { name: RE_QUICK_COMMENTS })
    ).toBeInTheDocument();
    expect(within(leftActions).getByRole("button", { name: RE_SHARE })).toBeInTheDocument();
  });

  it("falls back to initial avatar when sharer image fails to load", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const titleHeading = screen.getByRole("heading", { name: "Shared title" });
    const titleSection = titleHeading.closest("section") as HTMLElement;
    const avatarImage = within(titleSection).getByAltText("NOD Owner");

    fireEvent.error(avatarImage);

    const fallbackAvatar = within(titleSection).getByRole("img", { name: RE_SHARER_OWNER });
    expect(fallbackAvatar.tagName).toBe("DIV");
  });

  it("places original link below title and profile before quick actions row", async () => {
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const hero = screen.getByTestId("shared-title-hero");
    const titleHeading = within(hero).getByRole("heading", { name: "Shared title" });
    const originRow = within(hero).getByTestId("shared-title-origin-link-row");
    const profile = within(hero).getByTestId("shared-title-hero-meta");
    const quickActions = within(hero).getByTestId("shared-title-hero-quick-actions");

    expect(within(originRow).getByRole("link", { name: RE_VIEW_ORIGINAL })).toBeInTheDocument();
    expect(originRow.className).toContain("mt-2");
    expect(profile.className).not.toContain("border");
    expect(
      (titleHeading.compareDocumentPosition(originRow) & Node.DOCUMENT_POSITION_FOLLOWING) > 0
    ).toBe(true);
    expect(
      (originRow.compareDocumentPosition(profile) & Node.DOCUMENT_POSITION_FOLLOWING) > 0
    ).toBe(true);
    expect(
      (profile.compareDocumentPosition(quickActions) & Node.DOCUMENT_POSITION_FOLLOWING) > 0
    ).toBe(true);
  });

  it("submits a shared article comment", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });

    const mutateAsync = vi.fn().mockResolvedValue({
      id: "comment-id",
      author_name: "Viewer",
      content: "Great summary",
      created_at: "2026-03-22T00:00:00Z",
    });
    mockUseCreateSharedArticleComment.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    const hero = screen.getByTestId("shared-title-hero");
    const heroActions = within(hero).getByTestId("shared-title-hero-left-actions");
    fireEvent.click(within(heroActions).getByRole("button", { name: RE_QUICK_COMMENTS }));

    const panelTitle = await screen.findByRole("heading", { name: RE_RESPONSES_TITLE });
    const panel = panelTitle.closest("[role='dialog']") as HTMLElement;

    const commentInput = await within(panel).findByPlaceholderText(RE_LEAVE_REACTION);
    expect(commentInput.tagName).toBe("TEXTAREA");

    fireEvent.change(commentInput, {
      target: { value: "Great summary" },
    });

    expect(within(panel).queryByRole("button", { name: RE_ADD_COMMENT })).not.toBeInTheDocument();
    expect(within(panel).getByTestId("shared-comment-cancel-panel")).toBeInTheDocument();
    fireEvent.click(within(panel).getByTestId("shared-comment-submit-panel"));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        content: "Great summary",
      });
    });
  });

  it("shows viewer profile identity in comments side panel composer", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    const hero = screen.getByTestId("shared-title-hero");
    const heroActions = within(hero).getByTestId("shared-title-hero-left-actions");
    fireEvent.click(within(heroActions).getByRole("button", { name: RE_QUICK_COMMENTS }));

    const panelTitle = await screen.findByRole("heading", { name: RE_RESPONSES_TITLE });
    const panel = panelTitle.closest("[role='dialog']") as HTMLElement;

    expect(within(panel).getByTestId("shared-comment-viewer-profile-panel")).toBeInTheDocument();
    expect(within(panel).getByText(RE_VIEWER_NAME)).toBeInTheDocument();
  });

  it("shows viewer avatar image in comments side panel composer when available", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "viewer-user-id",
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
            avatar_url: "https://example.com/viewer.png",
          },
        },
      },
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    const hero = screen.getByTestId("shared-title-hero");
    const heroActions = within(hero).getByTestId("shared-title-hero-left-actions");
    fireEvent.click(within(heroActions).getByRole("button", { name: RE_QUICK_COMMENTS }));

    const panelTitle = await screen.findByRole("heading", { name: RE_RESPONSES_TITLE });
    const panel = panelTitle.closest("[role='dialog']") as HTMLElement;

    expect(
      within(panel).getByTestId("shared-comment-viewer-avatar-panel-image")
    ).toBeInTheDocument();
  });

  it("shows edit/delete actions for viewer-owned comments and submits both actions", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "viewer-user-id",
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });
    const updateMutateAsync = vi.fn().mockResolvedValue({
      id: "comment-owner",
      author_name: "Viewer",
      author_image: null,
      author_user_id: "viewer-user-id",
      content: "Updated content",
      created_at: "2026-03-22T12:00:00Z",
      empathy_count: 0,
      viewer_has_empathy: false,
      replies: [],
    });
    const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseUpdateSharedArticleComment.mockReturnValue({
      mutateAsync: updateMutateAsync,
      isPending: false,
    });
    mockUseDeleteSharedArticleComment.mockReturnValue({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    });
    mockUseSharedArticleComments.mockReturnValue({
      data: [
        {
          id: "comment-owner",
          author_name: "Viewer",
          author_image: null,
          author_user_id: "viewer-user-id",
          content: "Owner comment",
          created_at: "2026-03-22T12:00:00Z",
          empathy_count: 0,
          viewer_has_empathy: false,
          replies: [],
        },
      ],
      isLoading: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitFor(() => {
      expect(screen.getByTestId("shared-comment-menu-trigger-comment-owner")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("shared-comment-menu-trigger-comment-owner"));
    const editAction = await screen.findByTestId("shared-comment-menu-edit-comment-owner");
    fireEvent.click(editAction);

    const editInput = screen.getByTestId("shared-comment-edit-input-comment-owner");
    fireEvent.change(editInput, { target: { value: "Updated content" } });
    fireEvent.click(screen.getByTestId("shared-comment-edit-save-comment-owner"));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        commentId: "comment-owner",
        content: "Updated content",
      });
    });

    fireEvent.click(screen.getByTestId("shared-comment-menu-trigger-comment-owner"));
    const deleteAction = await screen.findByTestId("shared-comment-menu-delete-comment-owner");
    fireEvent.click(deleteAction);

    await waitFor(() => {
      expect(deleteMutateAsync).toHaveBeenCalledWith({
        commentId: "comment-owner",
      });
    });
  });

  it("shows report action for other users' comments", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "viewer-user-id",
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });
    mockUseSharedArticleComments.mockReturnValue({
      data: [
        {
          id: "comment-other",
          author_name: "Another User",
          author_image: null,
          author_user_id: "other-user-id",
          content: "Other comment",
          created_at: "2026-03-22T12:00:00Z",
          empathy_count: 0,
          viewer_has_empathy: false,
          replies: [],
        },
      ],
      isLoading: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitFor(() => {
      expect(screen.getByTestId("shared-comment-menu-trigger-comment-other")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("shared-comment-menu-trigger-comment-other"));

    expect(screen.queryByTestId("shared-comment-menu-edit-comment-other")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("shared-comment-menu-delete-comment-other")
    ).not.toBeInTheDocument();
    const reportAction = await screen.findByTestId("shared-comment-menu-report-comment-other");
    expect(reportAction).toHaveTextContent(RE_REPORT);

    fireEvent.click(reportAction);

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("renders author profile and localized comment time", async () => {
    mockUseSharedArticleComments.mockReturnValue({
      data: [
        {
          id: "comment-1",
          author_name: "Guest Author",
          author_image: null,
          content: "Great summary",
          created_at: "2026-03-22T10:00:00Z",
          empathy_count: 0,
          viewer_has_empathy: false,
          replies: [],
        },
      ],
      isLoading: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    expect(screen.getByRole("img", { name: RE_GUEST_AUTHOR })).toBeInTheDocument();
    const timestamp = screen.getByTestId("shared-comment-time-comment-1");
    expect(timestamp.tagName).toBe("TIME");
    expect(timestamp).toHaveAttribute("dateTime", "2026-03-22T10:00:00.000Z");
  });

  it("shows sharer badge next to timestamp when commenter is share owner", async () => {
    mockUseSharedArticleComments.mockReturnValue({
      data: [
        {
          id: "comment-owner",
          author_name: "NOD Owner",
          author_image: null,
          content: "Owner comment",
          created_at: "2026-03-22T12:00:00Z",
          empathy_count: 0,
          viewer_has_empathy: false,
          replies: [],
        },
      ],
      isLoading: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    expect(screen.getByTestId("shared-comment-sharer-badge-comment-owner")).toBeInTheDocument();
  });

  it("toggles empathy on a comment", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });
    mockUseSharedArticleComments.mockReturnValue({
      data: [
        {
          id: "comment-1",
          author_name: "Guest Author",
          author_image: null,
          content: "Great summary",
          created_at: "2026-03-22T10:00:00Z",
          empathy_count: 0,
          viewer_has_empathy: false,
          replies: [],
        },
      ],
      isLoading: false,
    });
    const mutateAsync = vi
      .fn()
      .mockResolvedValueOnce({ empathy_count: 1, viewer_has_empathy: true })
      .mockResolvedValueOnce({ empathy_count: 0, viewer_has_empathy: false });
    mockUseToggleSharedArticleCommentEmpathy.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    expect((await screen.findAllByText("Viewer")).length).toBeGreaterThan(0);

    const empathyButton = screen.getByTestId("shared-comment-empathy-comment-1");
    fireEvent.click(empathyButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ commentId: "comment-1" });
      expect(within(empathyButton).getByText("1")).toBeInTheDocument();
    });

    fireEvent.click(empathyButton);
    await waitFor(() => {
      expect(within(empathyButton).getByText("0")).toBeInTheDocument();
    });
  });

  it("renders replies and allows creating a reply", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });

    const mutateAsync = vi.fn().mockResolvedValue({
      id: "reply-2",
      author_name: "Viewer",
      content: "Thanks for sharing",
      created_at: "2026-03-22T11:00:00Z",
      parent_comment_id: "comment-1",
      empathy_count: 0,
      viewer_has_empathy: false,
      replies: [],
    });
    mockUseCreateSharedArticleComment.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    mockUseSharedArticleComments.mockReturnValue({
      data: [
        {
          id: "comment-1",
          author_name: "Guest Author",
          author_image: null,
          content: "Great summary",
          created_at: "2026-03-22T10:00:00Z",
          empathy_count: 0,
          viewer_has_empathy: false,
          replies: [
            {
              id: "reply-1",
              author_name: "Reply User",
              author_image: null,
              content: "Agree",
              created_at: "2026-03-22T10:20:00Z",
              parent_comment_id: "comment-1",
              empathy_count: 0,
              viewer_has_empathy: false,
              replies: [],
            },
          ],
        },
      ],
      isLoading: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    expect((await screen.findAllByText("Viewer")).length).toBeGreaterThan(0);

    const repliesToggle = screen.getByTestId("shared-comment-replies-toggle-comment-1");
    expect(repliesToggle).toHaveTextContent("1 reply");
    expect(screen.queryByText("Agree")).not.toBeInTheDocument();

    fireEvent.click(repliesToggle);
    expect(screen.getByText("Agree")).toBeInTheDocument();
    expect(repliesToggle).toHaveTextContent(RE_HIDE_REPLIES);

    fireEvent.click(screen.getByTestId("shared-comment-add-reply-comment-1"));
    fireEvent.change(screen.getByTestId("shared-comment-reply-input-comment-1"), {
      target: { value: "Thanks for sharing" },
    });
    expect(screen.getByTestId("shared-comment-reply-cancel-comment-1")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("shared-comment-reply-submit-comment-1"));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        content: "Thanks for sharing",
        parent_comment_id: "comment-1",
      });
    });
  });

  it("defaults to latest sort and supports switching to recommended sort", async () => {
    mockUseSharedArticleComments.mockReturnValue({
      data: [
        {
          id: "older-high-empathy",
          author_name: "Guest Author",
          author_image: null,
          content: "Older but recommended",
          created_at: "2026-03-22T09:00:00Z",
          empathy_count: 5,
          viewer_has_empathy: false,
          replies: [],
        },
        {
          id: "latest-low-empathy",
          author_name: "Guest Author",
          author_image: null,
          content: "Latest comment",
          created_at: "2026-03-22T10:00:00Z",
          empathy_count: 0,
          viewer_has_empathy: false,
          replies: [],
        },
      ],
      isLoading: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    await waitForAuthToResolve();

    const inlineSortSelect = screen.getByTestId("shared-comments-sort-select-inline");
    expect(inlineSortSelect).toHaveValue("latest");
    expect(screen.getByRole("combobox", { name: RE_SORT_BY })).toBeInTheDocument();

    const latestComment = screen.getByText("Latest comment");
    const recommendedComment = screen.getByText("Older but recommended");
    expect(
      (latestComment.compareDocumentPosition(recommendedComment) &
        Node.DOCUMENT_POSITION_FOLLOWING) >
        0
    ).toBe(true);

    fireEvent.change(inlineSortSelect, { target: { value: "recommended" } });

    await waitFor(() => {
      const updatedLatestComment = screen.getByText("Latest comment");
      const updatedRecommendedComment = screen.getByText("Older but recommended");
      expect(
        (updatedRecommendedComment.compareDocumentPosition(updatedLatestComment) &
          Node.DOCUMENT_POSITION_FOLLOWING) >
          0
      ).toBe(true);
    });
  });

  it("keeps textarea expanded after outside blur and closes only on cancel", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "viewer@example.com",
          user_metadata: {
            name: "Viewer",
          },
        },
      },
    });
    mockUseSharedArticleComments.mockReturnValue({
      data: [
        {
          id: "comment-1",
          author_name: "Guest Author",
          author_image: null,
          content: "Great summary",
          created_at: "2026-03-22T10:00:00Z",
          empathy_count: 0,
          viewer_has_empathy: false,
          replies: [],
        },
      ],
      isLoading: false,
    });
    mockUseSharedArticle.mockReturnValue({
      data: defaultSharedData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<SharedArticleView shareId="share-id" token="token-value" />);

    expect((await screen.findAllByText("Viewer")).length).toBeGreaterThan(0);

    const inlineComposer = screen.getByTestId("shared-comment-input-inline");
    expect(inlineComposer).toHaveAttribute("data-expanded", "false");

    fireEvent.focus(inlineComposer);
    await waitFor(() => {
      expect(inlineComposer).toHaveAttribute("data-expanded", "true");
    });

    fireEvent.blur(inlineComposer);
    await waitFor(() => {
      expect(inlineComposer).not.toHaveFocus();
      expect(inlineComposer).toHaveAttribute("data-expanded", "true");
    });

    fireEvent.mouseDown(screen.getByTestId("shared-comment-cancel-inline"));
    fireEvent.click(screen.getByTestId("shared-comment-cancel-inline"));
    await waitFor(() => {
      expect(inlineComposer).toHaveAttribute("data-expanded", "false");
    });

    fireEvent.click(screen.getByTestId("shared-comment-add-reply-comment-1"));
    const replyComposer = screen.getByTestId("shared-comment-reply-input-comment-1");
    expect(replyComposer).toHaveAttribute("data-expanded", "true");

    fireEvent.blur(replyComposer);
    await waitFor(() => {
      expect(replyComposer).not.toHaveFocus();
      expect(replyComposer).toHaveAttribute("data-expanded", "true");
    });

    fireEvent.mouseDown(screen.getByTestId("shared-comment-reply-cancel-comment-1"));
    fireEvent.click(screen.getByTestId("shared-comment-reply-cancel-comment-1"));
    await waitFor(() => {
      expect(screen.queryByTestId("shared-comment-reply-input-comment-1")).not.toBeInTheDocument();
    });
  });
});
