import { describe, expect, it } from "vitest";
import type { SharedArticle } from "../../../../lib/api/articles";
import { resolveSharedMetadataImage, resolveSharedMetadataUrl } from "./metadata-utils";

function createSharedArticle(overrides?: Partial<SharedArticle>): SharedArticle {
  return {
    share_id: "share-id",
    share_slug: "shared-title",
    share_sid: "abc123def456",
    canonical_share_path: "/share/shared-title-share-id",
    article_id: "article-id",
    title: "Shared title",
    source: "web",
    url: "https://example.com/article",
    created_at: "2026-03-23T00:00:00Z",
    summary: "Summary text",
    markdown_note: null,
    key_points: ["Point A"],
    concepts: ["Concept A"],
    reading_time_minutes: 2,
    language: "en",
    content_type: "general_news",
    type_metadata: {},
    empathy_count: 0,
    viewer_has_empathy: false,
    sharer: {
      name: "NOD Owner",
      image: null,
    },
    ...overrides,
  };
}

describe("resolveSharedMetadataUrl", () => {
  const baseOptions = {
    siteOrigin: "https://nod-archive.com",
    locale: "en",
    shareId: "share-id",
    token: "token-value",
  };

  it("uses localized shared route when url_mode is default", () => {
    const shared = createSharedArticle({ url_mode: "default" });

    expect(resolveSharedMetadataUrl(shared, baseOptions)).toBe(
      "https://nod-archive.com/en/share/share-id?token=token-value"
    );
  });

  it("uses absolute custom_url when url_mode is manual", () => {
    const shared = createSharedArticle({
      url_mode: "manual",
      custom_url: "https://example.com/custom-share",
    });

    expect(resolveSharedMetadataUrl(shared, baseOptions)).toBe("https://example.com/custom-share");
  });

  it("normalizes relative custom_url and appends token", () => {
    const shared = createSharedArticle({
      url_mode: "manual",
      custom_url: "team-update",
    });

    expect(resolveSharedMetadataUrl(shared, baseOptions)).toBe(
      "https://nod-archive.com/en/share/team-update?token=token-value"
    );
  });
});

describe("resolveSharedMetadataImage", () => {
  const siteOrigin = "https://nod-archive.com";

  it("falls back to default brand image in default mode", () => {
    const shared = createSharedArticle({ thumbnail_mode: "default" });

    expect(
      resolveSharedMetadataImage(shared, {
        siteOrigin,
        locale: "en",
        shareId: "share-id",
        token: "token-value",
      })
    ).toBe("http://localhost:8000/api/articles/share/og-image/share-id?token=token-value");
  });

  it("uses derived OG route even in manual thumbnail mode", () => {
    const shared = createSharedArticle({
      thumbnail_mode: "manual",
      thumbnail_url: "https://cdn.example.com/og/custom.png",
    });

    expect(
      resolveSharedMetadataImage(shared, {
        siteOrigin,
        locale: "en",
        shareId: "share-id",
        token: "token-value",
      })
    ).toBe("http://localhost:8000/api/articles/share/og-image/share-id?token=token-value");
  });

  it("keeps using derived OG route for relative manual thumbnail_url", () => {
    const shared = createSharedArticle({
      thumbnail_mode: "manual",
      thumbnail_url: "og/custom.png",
    });

    expect(
      resolveSharedMetadataImage(shared, {
        siteOrigin,
        locale: "en",
        shareId: "share-id",
        token: "token-value",
      })
    ).toBe("http://localhost:8000/api/articles/share/og-image/share-id?token=token-value");
  });

  it("encodes query params in default dynamic image URL", () => {
    const shared = createSharedArticle({ thumbnail_mode: "default" });

    expect(
      resolveSharedMetadataImage(shared, {
        siteOrigin,
        locale: "ko",
        shareId: "share id",
        token: "token with space",
      })
    ).toBe("http://localhost:8000/api/articles/share/og-image/share%20id?token=token+with+space");
  });

  it("omits token param when token is empty string", () => {
    const shared = createSharedArticle({ thumbnail_mode: "default" });

    expect(
      resolveSharedMetadataImage(shared, {
        siteOrigin,
        locale: "ko",
        shareId: "my-slug-abc123",
        token: "",
      })
    ).toBe("http://localhost:8000/api/articles/share/og-image/my-slug-abc123");
  });
});
