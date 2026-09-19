import React from "react";
import { Icon } from "../actions/Icon.jsx";
import { Button } from "../actions/Button.jsx";
/** Getting-started guidance: sage border + light background, short copy, CTA, dismiss. */
export function Notice({ icon = "extension", title, children, actionLabel, onAction, onDismiss, style }) {
  return (
    <section role="note" style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: 12, alignItems: "start", padding: 16, background: "color-mix(in srgb, var(--color-sage) 14%, var(--surface-card))",
      border: "2px solid var(--border-sage)", borderRadius: "var(--radius-panel)", ...style }}>
      <Icon name={icon} size={24} style={{ color: "var(--text-primary)", marginTop: 2 }} />
      <div style={{ display: "grid", gap: 8 }}>
        {title ? <h3 style={{ fontSize: 16, fontWeight: 600, fontFamily: "var(--font-body)" }}>{title}</h3> : null}
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>{children}</p>
        {actionLabel ? <div><Button variant="mint" size="sm" onClick={onAction}>{actionLabel}</Button></div> : null}
      </div>
      {onDismiss ? <button type="button" aria-label="닫기" onClick={onDismiss} style={{ width: 36, height: 36, display: "grid", placeItems: "center", border: 0, background: "transparent", borderRadius: "var(--radius-control)", color: "var(--text-primary)" }}><Icon name="close" size={20} /></button> : null}
    </section>
  );
}
