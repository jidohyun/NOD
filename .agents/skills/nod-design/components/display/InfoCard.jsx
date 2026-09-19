import React from "react";
import { Icon } from "../actions/Icon.jsx";
export function InfoCard({ icon, iconTint = "var(--surface-lavender)", title, children, tilt = 0, padding = "var(--card-padding)", style }) {
  return (
    <section style={{ background: "var(--surface-card)", border: "var(--border-doodle)", borderRadius: "var(--radius-doodle-thick)", boxShadow: "var(--shadow-sketch-large)", padding, transform: tilt ? `rotate(${tilt}deg)` : undefined, ...style }}>
      {icon ? <div aria-hidden="true" style={{ width: 64, height: 64, display: "grid", placeItems: "center", background: iconTint, borderRadius: "var(--radius-organic)", marginBottom: 16 }}><Icon name={icon} size={32} /></div> : null}
      {title ? <h2 style={{ fontSize: "var(--text-component-title)", lineHeight: "var(--leading-component)", fontWeight: 600, marginBottom: 8 }}>{title}</h2> : null}
      <div style={{ color: "var(--text-secondary)", fontSize: "var(--text-body)", lineHeight: "var(--leading-body)" }}>{children}</div>
    </section>
  );
}
