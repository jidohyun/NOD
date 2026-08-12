import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createArticleShareLink,
  fetchSharedArticle,
  fetchSharedArticleBySlug,
  revokeArticleShareLink,
} from "@/lib/api/articles";
import { apiClient } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    post: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}));

describe("article share api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates share link for an article", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        share_id: "share-id",
        expires_at: null,
        share_url: "/share/share-id?token=t",
        share_slug: "shared-title",
        canonical_share_url: "/share/shared-title-share-id",
      },
    });

    const result = await createArticleShareLink("article-id");

    expect(apiClient.post).toHaveBeenCalledWith("/api/articles/article-id/share-link", undefined);
    expect(result.share_id).toBe("share-id");
    expect(result.share_slug).toBe("shared-title");
    expect(result.canonical_share_url).toBe("/share/shared-title-share-id");
  });

  it("creates share link with publish-style options", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        share_id: "share-id",
        expires_at: null,
        share_url: "/share/share-id?token=t",
        share_slug: "shared-title",
        canonical_share_url: "/share/shared-title-share-id",
      },
    });

    await createArticleShareLink("article-id", {
      url_mode: "manual",
      custom_url: "team-update",
      thumbnail_mode: "manual",
      thumbnail_url: "https://cdn.example.com/og/custom.png",
    });

    expect(apiClient.post).toHaveBeenCalledWith("/api/articles/article-id/share-link", {
      url_mode: "manual",
      custom_url: "team-update",
      thumbnail_mode: "manual",
      thumbnail_url: "https://cdn.example.com/og/custom.png",
    });
  });

  it("revokes share link for an article", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

    await revokeArticleShareLink("article-id");

    expect(apiClient.delete).toHaveBeenCalledWith("/api/articles/article-id/share-link");
  });

  it("fetches shared article with token", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        article_id: "article-id",
        share_id: "share-id",
        share_slug: "shared-title",
        share_sid: "abcd1234efgh",
        canonical_share_path: "/share/shared-title-share-id",
        title: "Shared title",
        source: "web",
        url: "https://example.com",
        created_at: "2026-03-21T00:00:00Z",
        summary: "Summary",
        key_points: ["Point"],
        concepts: ["Concept"],
        reading_time_minutes: 2,
        language: "en",
        content_type: "general_news",
        type_metadata: {},
      },
    });

    const result = await fetchSharedArticle("share-id", "token-value");

    expect(apiClient.get).toHaveBeenCalledWith("/api/articles/share/share-id", {
      params: { token: "token-value" },
      headers: { "Cache-Control": "no-cache" },
    });
    expect(result.title).toBe("Shared title");
  });

  it("fetches shared article by slug with token", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        article_id: "article-id",
        share_id: "share-id",
        share_slug: "shared-title-share-id",
        share_sid: "abcd1234efgh",
        canonical_share_path: "/share/shared-title-share-id",
        title: "Shared title",
        source: "web",
        url: "https://example.com",
        created_at: "2026-03-21T00:00:00Z",
        summary: "Summary",
        key_points: ["Point"],
        concepts: ["Concept"],
        reading_time_minutes: 2,
        language: "en",
        content_type: "general_news",
        type_metadata: {},
      },
    });

    const result = await fetchSharedArticleBySlug("shared-title-share-id", "token-value");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/articles/share/by-slug/shared-title-share-id",
      {
        params: { token: "token-value" },
        headers: { "Cache-Control": "no-cache" },
      }
    );
    expect(result.share_slug).toBe("shared-title-share-id");
  });
});
