import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "NOD — Your AI-Powered Second Brain";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
      }}
    >
      {/* Decorative gold accent line at top */}
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

      {/* Subtle background glow */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,185,49,0.08) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* NOD logo text */}
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          color: "#E8B931",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          display: "flex",
        }}
      >
        NOD
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 32,
          color: "#fffdfa",
          marginTop: 24,
          opacity: 0.9,
          display: "flex",
        }}
      >
        Your AI-Powered Second Brain
      </div>

      {/* Feature pills */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: 40,
        }}
      >
        {["AI Summaries", "Semantic Search", "Knowledge Engine"].map((text) => (
          <div
            key={text}
            style={{
              padding: "8px 20px",
              borderRadius: "20px",
              border: "1px solid rgba(232,185,49,0.3)",
              color: "rgba(255,253,250,0.7)",
              fontSize: 18,
              display: "flex",
            }}
          >
            {text}
          </div>
        ))}
      </div>

      {/* Bottom accent */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          color: "rgba(255,253,250,0.4)",
          fontSize: 16,
          display: "flex",
        }}
      >
        nod-archive.com
      </div>
    </div>,
    { ...size }
  );
}
