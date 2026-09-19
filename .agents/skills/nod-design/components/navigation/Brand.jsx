import React from "react";
/** NOD logo (assets/nod-logo.png — from repo apps/web/public/brand). variant "mark" uses the square icon. */
export function Brand({ size = 28, variant = "wordmark", href = "/", style }) {
  const base = new URL("../../assets/", import.meta.url).href;
  const src = variant === "mark" ? base + "nod-icon.png" : base + "nod-logo.png";
  return (
    <a href={href} aria-label="NOD 홈" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", ...style }}>
      <img src={src} alt="NOD" style={{ height: variant === "mark" ? size : size * 1.15, width: "auto", display: "block", borderRadius: variant === "mark" ? "var(--radius-control)" : 0 }} />
    </a>
  );
}
