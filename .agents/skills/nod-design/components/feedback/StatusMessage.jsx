import React from "react";
import { Icon } from "../actions/Icon.jsx";
const map = {
  info: { fg: "var(--text-secondary)", icon: "info" },
  loading: { fg: "var(--text-secondary)", icon: "progress_activity" },
  success: { fg: "var(--status-success-text)", icon: "check_circle" },
  warning: { fg: "var(--status-warning-text)", icon: "warning" },
  error: { fg: "var(--status-error-text)", icon: "error" },
};
/** Inline live-region status line (aria-live). Reserve min-height so layout doesn't jump. */
export function StatusMessage({ kind = "info", children, style }) {
  const m = map[kind];
  return (
    <p role="status" aria-live="polite" style={{ margin: 0, minHeight: 24, display: "flex", alignItems: "center", gap: 6, fontSize: 14, lineHeight: 1.5, color: m.fg, ...style }}>
      {children ? <Icon name={m.icon} size={20} fill={kind === "loading" ? 0 : 1} style={kind === "loading" ? { animation: "nod-spin 1s linear infinite" } : undefined} /> : null}
      <span>{children}</span>
    </p>
  );
}
