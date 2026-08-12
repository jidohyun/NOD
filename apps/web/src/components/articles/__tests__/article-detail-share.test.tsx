import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/utils";
import { ArticleDetail } from "../article-detail";

const RE_SHARE_LINK = /^share$/i;
const RE_DELETE = /^delete$/i;
const RE_SHARE_HEADING = /^share this summary$/i;
const RE_ANALYZED_BY = /analyzed by/i;
const RE_SHARE_MODAL_TITLE = /share this summary\?/i;
const RE_SHARE_MODAL_DESCRIPTION = /other people can view this content's ai summary/i;
const RE_ALREADY_SHARED_TITLE = /share link created!/i;
const RE_ALREADY_SHARED_DESCRIPTION = /copy the link below to share/i;
const RE_SHARE_MODAL_INCLUDED_TITLE = /this shared link includes/i;
const RE_SHARE_MODAL_INCLUDED_SUMMARY = /ai-generated summary/i;
const RE_SHARE_MODAL_INCLUDED_CONCEPTS = /core concepts/i;
const RE_SHARE_MODAL_INCLUDED_KEYPOINTS = /key points/i;
const RE_SHARE_MODAL_HINT = /only share this link with people you trust/i;
const RE_SHARE_MODAL_CANCEL = /^cancel$/i;
const RE_SHARE_MODAL_CONFIRM = /^generate share link$/i;
const RE_SHARE_MODAL_COPY = /^copy link$/i;
const RE_SHARE_URL_MODE_MANUAL = /set custom url/i;
const RE_SHARE_OG_MODE_MANUAL = /set custom og image/i;
const RE_SHARE_CUSTOM_URL_INPUT = /custom share url/i;
const RE_SHARE_CUSTOM_OG_INPUT = /custom thumbnail url/i;
const RE_SHARED_URL = /\/share\/shared-title-share-id/i;
const RE_EXISTING_SHARED_URL = /\/share\/existing-id\?token=existing/i;
const SHARE_STORAGE_KEY = "article-share-link:article-id";

const mockUseArticle = vi.fn();
const mockCreateShareMutate = vi.fn();
const mockClipboardWriteText = vi.fn();
let localStorageState: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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
  useCreateArticleShareLink: () => ({ mutateAsync: mockCreateShareMutate, isPending: false }),
  useRevokeArticleShareLink: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("ArticleDetail share actions", () => {
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
          markdown_note: null,
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
        clipboard: {
          writeText: mockClipboardWriteText.mockResolvedValue(undefined),
        },
      },
      configurable: true,
    });

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => localStorageState[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageState[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageState[key];
        }),
        clear: vi.fn(() => {
          localStorageState = {};
        }),
      },
      configurable: true,
    });
  });

  it("opens share confirmation modal from top card action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ArticleDetail id="article-id" />);

    await user.click(screen.getByRole("button", { name: RE_SHARE_LINK }));

    expect(screen.getByRole("heading", { name: RE_SHARE_MODAL_TITLE })).toBeTruthy();
    expect(screen.getByText(RE_SHARE_MODAL_DESCRIPTION)).toBeTruthy();
    expect(screen.getByText(RE_SHARE_MODAL_INCLUDED_TITLE)).toBeTruthy();
    expect(screen.getByText(RE_SHARE_MODAL_INCLUDED_SUMMARY)).toBeTruthy();
    expect(screen.getByText(RE_SHARE_MODAL_INCLUDED_CONCEPTS)).toBeTruthy();
    expect(screen.getAllByText(RE_SHARE_MODAL_INCLUDED_KEYPOINTS).length).toBeGreaterThan(0);
    expect(screen.getByText(RE_SHARE_MODAL_HINT)).toBeTruthy();
  });

  it("keeps share action in same action cluster as delete", () => {
    renderWithProviders(<ArticleDetail id="article-id" />);

    const shareAction = screen.getByRole("button", { name: RE_SHARE_LINK });
    const deleteAction = screen.getByRole("button", { name: RE_DELETE });

    expect(shareAction.parentElement).toBe(deleteAction.parentElement);
  });

  it("does not generate link when modal is cancelled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ArticleDetail id="article-id" />);

    await user.click(screen.getByRole("button", { name: RE_SHARE_LINK }));
    await user.click(screen.getByRole("button", { name: RE_SHARE_MODAL_CANCEL }));

    expect(mockCreateShareMutate).not.toHaveBeenCalled();
  });

  it("shows generated link in modal and marks copy complete", async () => {
    mockCreateShareMutate.mockResolvedValue({
      share_id: "share-id",
      expires_at: null,
      share_url: "/share/share-id?token=test-token",
      share_slug: "shared-title",
      canonical_share_url: "/share/shared-title-share-id",
    });

    const user = userEvent.setup();
    renderWithProviders(<ArticleDetail id="article-id" />);

    await user.click(screen.getByRole("button", { name: RE_SHARE_LINK }));

    expect(screen.queryByRole("button", { name: RE_SHARE_MODAL_COPY })).toBeNull();

    await user.click(screen.getByRole("button", { name: RE_SHARE_MODAL_CONFIRM }));

    await waitFor(() => {
      expect(mockCreateShareMutate).toHaveBeenCalledWith({
        articleId: "article-id",
        options: {
          url_mode: "default",
          thumbnail_mode: "default",
        },
      });
      expect(screen.getByText(RE_SHARED_URL)).toBeTruthy();
      expect(screen.getByRole("button", { name: RE_SHARE_MODAL_COPY })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: RE_SHARE_MODAL_COPY }));

    await waitFor(() => {
      const copyButton = screen.getByRole("button", { name: RE_SHARE_MODAL_COPY });
      expect(copyButton.querySelector(".lucide-check")).toBeTruthy();
    });
  });

  it("reuses stored shared link after refresh without creating a new one", async () => {
    localStorageState[SHARE_STORAGE_KEY] = "http://localhost/share/existing-id?token=existing";

    const user = userEvent.setup();
    const rendered = renderWithProviders(<ArticleDetail id="article-id" />);
    rendered.unmount();

    renderWithProviders(<ArticleDetail id="article-id" />);

    await user.click(screen.getByRole("button", { name: RE_SHARE_LINK }));

    expect(screen.getByRole("heading", { name: RE_ALREADY_SHARED_TITLE })).toBeTruthy();
    expect(screen.getByText(RE_ALREADY_SHARED_DESCRIPTION)).toBeTruthy();
    expect(screen.getByText(RE_EXISTING_SHARED_URL)).toBeTruthy();
    expect(screen.getByRole("button", { name: RE_SHARE_MODAL_COPY })).toBeTruthy();
    expect(screen.queryByRole("button", { name: RE_SHARE_MODAL_CONFIRM })).toBeNull();
    expect(screen.queryByText(RE_SHARE_MODAL_INCLUDED_TITLE)).toBeNull();
    expect(mockCreateShareMutate).not.toHaveBeenCalled();
  });

  it("shows manual URL/OG fields and submits manual settings", async () => {
    mockCreateShareMutate.mockResolvedValue({
      share_id: "share-id",
      expires_at: null,
      share_url: "/share/share-id?token=test-token",
      share_slug: "shared-title",
      canonical_share_url: "/share/shared-title-share-id",
    });

    const user = userEvent.setup();
    renderWithProviders(<ArticleDetail id="article-id" />);

    await user.click(screen.getByRole("button", { name: RE_SHARE_LINK }));

    await user.click(screen.getByLabelText(RE_SHARE_URL_MODE_MANUAL));
    await user.click(screen.getByLabelText(RE_SHARE_OG_MODE_MANUAL));

    expect(screen.getByRole("textbox", { name: RE_SHARE_CUSTOM_URL_INPUT })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: RE_SHARE_CUSTOM_OG_INPUT })).toBeTruthy();

    await user.type(
      screen.getByRole("textbox", { name: RE_SHARE_CUSTOM_URL_INPUT }),
      "team-update"
    );
    await user.type(
      screen.getByRole("textbox", { name: RE_SHARE_CUSTOM_OG_INPUT }),
      "https://cdn.example.com/og/custom.png"
    );

    await user.click(screen.getByRole("button", { name: RE_SHARE_MODAL_CONFIRM }));

    await waitFor(() => {
      expect(mockCreateShareMutate).toHaveBeenCalledWith({
        articleId: "article-id",
        options: {
          url_mode: "manual",
          custom_url: "team-update",
          thumbnail_mode: "manual",
          thumbnail_url: "https://cdn.example.com/og/custom.png",
        },
      });
    });
  });

  it("removes standalone share section heading", () => {
    mockCreateShareMutate.mockResolvedValue({
      share_id: "share-id",
      expires_at: null,
      share_url: "/share/share-id?token=test-token",
      share_slug: "shared-title",
      canonical_share_url: "/share/shared-title-share-id",
    });
    renderWithProviders(<ArticleDetail id="article-id" />);

    expect(screen.queryByRole("heading", { name: RE_SHARE_HEADING })).toBeNull();
  });

  it("does not render analyzed-by footer metadata", () => {
    renderWithProviders(<ArticleDetail id="article-id" />);

    expect(screen.queryByText(RE_ANALYZED_BY)).toBeNull();
  });
});
