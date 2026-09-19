import React from "react";
import { Icon } from "../actions/Icon.jsx";
import { Button } from "../actions/Button.jsx";
/** Empty / no-results / error-with-retry block. tone="error" uses the light red area. */
export function EmptyState({ icon = "bookmark_add", tone = "neutral", title, children, actionLabel, onAction, style }) {
  const error = tone === "error";
  return (
    <div style={{ display: "grid", justifyItems: "center", textAlign: "center", gap: 8, padding: "48px 24px", background: error ? "var(--status-error-bg)" : "var(--surface-card)",
      border: error ? "2px solid var(--status-error-text)" : "2px dashed var(--border-subtle)", borderRadius: "var(--radius-panel)", ...style }}>
      <div aria-hidden="true" style={{ width: 64, height: 64, display: "grid", placeItems: "center", background: error ? "var(--surface-card)" : "var(--surface-mint)", borderRadius: "var(--radius-blob)", color: error ? "var(--status-error-text)" : "var(--text-primary)", marginBottom: 8 }}><Icon name={icon} size={32} /></div>
      <h2 style={{ fontSize: "var(--text-component-title)", fontWeight: 600, color: error ? "var(--status-error-text)" : "var(--text-primary)" }}>{title}</h2>
      <p style={{ margin: 0, maxWidth: 360, fontSize: 16, lineHeight: 1.6, color: error ? "var(--status-error-text)" : "var(--text-secondary)" }}>{children}</p>
      {actionLabel ? <Button variant={error ? "secondary" : "primary"} onClick={onAction} icon={error ? "refresh" : undefined} style={{ marginTop: 12 }}>{actionLabel}</Button> : null}
    </div>
  );
}
