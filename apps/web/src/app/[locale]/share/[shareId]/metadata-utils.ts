import type { SharedArticle } from "@/lib/api/articles";

function toAbsoluteUrl(siteOrigin: string, pathOrUrl: string): string {
  return new URL(pathOrUrl, siteOrigin).toString();
}

export function resolveSharedMetadataUrl(
  shared: SharedArticle,
  options: {
    siteOrigin: string;
    locale: string;
    shareId: string;
    token: string;
  }
): string {
  const { siteOrigin, locale, shareId, token } = options;
  const defaultPath = `/${locale}/share/${shareId}?token=${encodeURIComponent(token)}`;

  const hasManualUrl = shared.url_mode === "manual" && Boolean(shared.custom_url?.trim());
  if (!hasManualUrl) {
    return toAbsoluteUrl(siteOrigin, defaultPath);
  }

  const customUrl = shared.custom_url!.trim();
  if (customUrl.startsWith("http://") || customUrl.startsWith("https://")) {
    return customUrl;
  }

  const customPath = customUrl.startsWith("/") ? customUrl : `/${locale}/share/${customUrl}`;
  const hasQuery = customPath.includes("?");
  const pathWithToken = hasQuery
    ? `${customPath}&token=${encodeURIComponent(token)}`
    : `${customPath}?token=${encodeURIComponent(token)}`;

  return toAbsoluteUrl(siteOrigin, pathWithToken);
}

export function resolveSharedMetadataImage(
  shared: SharedArticle,
  options: {
    siteOrigin: string;
    locale: string;
    shareId: string;
    token: string;
  }
): string {
  const { siteOrigin, locale, shareId, token } = options;
  const hasManualThumbnail =
    shared.thumbnail_mode === "manual" && Boolean(shared.thumbnail_url?.trim());
  if (!hasManualThumbnail) {
    const params = new URLSearchParams({ locale, shareId });
    if (token) {
      params.set("token", token);
    }
    return toAbsoluteUrl(siteOrigin, `/api/og/shared-article?${params.toString()}`);
  }

  const thumbnailImageUrl = shared.thumbnail_url!.trim();
  if (thumbnailImageUrl.startsWith("http://") || thumbnailImageUrl.startsWith("https://")) {
    return thumbnailImageUrl;
  }

  const normalizedPath = thumbnailImageUrl.startsWith("/")
    ? thumbnailImageUrl
    : `/${thumbnailImageUrl}`;
  return toAbsoluteUrl(siteOrigin, normalizedPath);
}
