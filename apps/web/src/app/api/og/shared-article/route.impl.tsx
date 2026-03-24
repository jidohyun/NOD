import { ImageResponse } from "next/og";
import {
  formatOgDescription,
  formatOgHeadline,
} from "@/app/[locale]/share/[shareId]/og-text-utils";
import type { SharedArticle } from "@/lib/api/articles";

export const runtime = "edge";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

function buildApiUrl(shareId: string, token: string | null): string {
  const apiBase = getApiBaseUrl();
  const path = UUID_RE.test(shareId)
    ? `/api/articles/share/${encodeURIComponent(shareId)}`
    : `/api/articles/share/by-slug/${encodeURIComponent(shareId)}`;
  const apiUrl = new URL(path, apiBase);
  if (token) {
    apiUrl.searchParams.set("token", token);
  }
  apiUrl.searchParams.set("no_track", "true");
  return apiUrl.toString();
}

function getArticleHost(articleUrl: string | null | undefined): string | null {
  if (!articleUrl) {
    return null;
  }

  try {
    return new URL(articleUrl).host;
  } catch {
    return null;
  }
}

function renderFallbackImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px",
        background: "linear-gradient(135deg, #0f172a 0%, #1f2937 55%, #111827 100%)",
        color: "#f9fafb",
      }}
    >
      <div style={{ display: "flex", fontSize: 70, fontWeight: 900, color: "#E8B931" }}>NOD</div>
      <div
        style={{ display: "flex", marginTop: 18, fontSize: 40, fontWeight: 700, lineHeight: 1.25 }}
      >
        Shared Article
      </div>
    </div>,
    { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }
  );
}

function renderSharedImage(shared: SharedArticle) {
  const headline = formatOgHeadline(shared.title);
  const description = formatOgDescription(shared.summary);
  const articleHost = getArticleHost(shared.url);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(132deg, #090B10 0%, #1A1F2D 52%, #0D111B 100%)",
        color: "#F9FAFB",
        fontFamily:
          "Inter, Pretendard, Apple SD Gothic Neo, Noto Sans KR, Noto Sans, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(680px 380px at 8% 12%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.46) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "54px 62px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 800,
            color: "#E8B931",
            letterSpacing: "0.04em",
          }}
        >
          NOD
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "20px",
            fontSize: 66,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontWeight: 800,
            maxWidth: "900px",
            textShadow: "0 2px 0 rgba(0,0,0,0.35)",
          }}
        >
          {headline}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "28px",
            fontSize: 34,
            lineHeight: 1.35,
            fontWeight: 500,
            maxWidth: "920px",
            color: "rgba(249, 250, 251, 0.92)",
          }}
        >
          {description}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "rgba(249, 250, 251, 0.88)",
            }}
          >
            <div style={{ display: "flex", fontSize: 28, fontWeight: 800 }}>
              {shared.sharer.display_name}
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "rgba(249, 250, 251, 0.65)" }}>
              shared via NOD
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 20, color: "rgba(249, 250, 251, 0.62)" }}>
            {articleHost ?? "nod-archive.com"}
          </div>
        </div>
      </div>
    </div>,
    { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shareId = url.searchParams.get("shareId")?.trim();
  const token = url.searchParams.get("token")?.trim();

  if (!shareId) {
    const image = renderFallbackImage();
    image.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return image;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(buildApiUrl(shareId, token ?? null), {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const image = renderFallbackImage();
      image.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      return image;
    }

    const shared = (await response.json()) as SharedArticle;
    const image = renderSharedImage(shared);
    image.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=2592000");
    return image;
  } catch {
    const image = renderFallbackImage();
    image.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return image;
  } finally {
    clearTimeout(timeout);
  }
}
