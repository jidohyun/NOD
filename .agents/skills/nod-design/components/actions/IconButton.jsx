import React from "react";
import { Icon } from "./Icon.jsx";
export function IconButton({ icon, label, tone = "default", size = 44, disabled, style, ...rest }) {
  const [h, setH] = React.useState(false);
  const danger = tone === "danger";
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: size, height: size, display: "inline-grid", placeItems: "center", border: h ? "var(--border-doodle)" : "2px solid transparent",
        borderRadius: "var(--radius-control)", background: h ? (danger ? "var(--status-error-bg)" : "var(--surface-subtle)") : "transparent",
        color: h && danger ? "var(--status-error-text)" : "var(--text-primary)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transition: "background var(--duration-hover) var(--ease-out), border-color var(--duration-hover) var(--ease-out)", ...style }} {...rest}>
      <Icon name={icon} size={size >= 44 ? 24 : 20} />
    </button>
  );
}
