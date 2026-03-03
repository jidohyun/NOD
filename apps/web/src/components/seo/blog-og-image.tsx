import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogRuntime = "edge";

export function generateBlogOgImage(title: string) {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "60px 80px",
      }}
    >
      {/* Gold accent line at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, transparent 0%, #E8B931 50%, transparent 100%)",
          display: "flex",
        }}
      />

      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,185,49,0.06) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* NOD logo */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 900,
          color: "#E8B931",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          display: "flex",
          marginBottom: 32,
        }}
      >
        NOD
      </div>

      {/* Blog post title */}
      <div
        style={{
          fontSize: title.length > 60 ? 36 : 44,
          fontWeight: 700,
          color: "#fffdfa",
          textAlign: "center",
          lineHeight: 1.3,
          display: "flex",
          maxWidth: "900px",
        }}
      >
        {title}
      </div>

      {/* Blog label */}
      <div
        style={{
          display: "flex",
          marginTop: 32,
          padding: "8px 20px",
          borderRadius: "20px",
          border: "1px solid rgba(232,185,49,0.3)",
          color: "rgba(255,253,250,0.7)",
          fontSize: 18,
        }}
      >
        Blog
      </div>

      {/* Bottom URL */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          color: "rgba(255,253,250,0.4)",
          fontSize: 16,
          display: "flex",
        }}
      >
        nod-archive.com/blog
      </div>
    </div>,
    { ...ogSize }
  );
}
