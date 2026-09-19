import React from "react";
import { Icon } from "../actions/Icon.jsx";
const tones = {
  neutral: { bg: "var(--surface-subtle)", fg: "var(--text-primary)" },
  brand: { bg: "var(--surface-selected)", fg: "var(--text-accent)" },
  mint: { bg: "var(--surface-mint)", fg: "var(--text-primary)" },
  lavender: { bg: "var(--surface-lavender)", fg: "var(--text-primary)" },
  success: { bg: "var(--status-success-bg)", fg: "var(--status-success-text)", icon: "check_circle" },
  warning: { bg: "var(--status-warning-bg)", fg: "var(--status-warning-text)", icon: "warning" },
  error: { bg: "var(--status-error-bg)", fg: "var(--status-error-text)", icon: "error" },
};
export function Badge({ tone = "neutral", icon, children, style }) {
  const t = tones[tone]; const glyph = icon ?? t.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 12px", borderRadius: "var(--radius-pill)", background: t.bg, color: t.fg, fontSize: 14, fontWeight: "var(--weight-bold)", lineHeight: 1, whiteSpace: "nowrap", ...style }}>
      {glyph ? <Icon name={glyph} size={20} fill={1} /> : null}{children}
    </span>
  );
}
