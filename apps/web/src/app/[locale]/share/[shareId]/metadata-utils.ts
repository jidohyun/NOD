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
  const { shareId, token } = options;

  // Use original blog og:image directly when available
  if (shared.og_image_url) {
    return shared.og_image_url;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.nod-archive.com";
  const ogUrl = new URL(`/api/articles/share/og-image/${encodeURIComponent(shareId)}`, apiBase);
  if (token) {
    ogUrl.searchParams.set("token", token);
  }
  return ogUrl.toString();
}
