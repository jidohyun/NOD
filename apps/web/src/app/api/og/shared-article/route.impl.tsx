import { ImageResponse } from "next/og";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

function getSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NODE_ENV === "production") return "https://nod-archive.com";
  return "http://localhost:3000";
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

async function takeScreenshot(shareId: string, token: string | null): Promise<Buffer> {
  const origin = getSiteOrigin();
  const previewUrl = new URL(`/og-preview/${encodeURIComponent(shareId)}`, origin);
  if (token) previewUrl.searchParams.set("token", token);

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/chromium-browser");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(previewUrl.toString(), { waitUntil: "networkidle0", timeout: 10000 });
    const screenshot = await page.screenshot({ type: "png" });
    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
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

  try {
    const png = await takeScreenshot(shareId, token ?? null);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=2592000",
      },
    });
  } catch {
    const image = renderFallbackImage();
    image.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return image;
  }
}
