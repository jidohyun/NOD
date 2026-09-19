import React from "react";
import { Icon } from "../actions/Icon.jsx";
export function TextInput({ label, hideLabel = false, hint, error, icon, trailing, type = "text", id, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const uid = React.useId(); const inputId = id || uid;
  return (
    <div style={{ display: "grid", gap: 6, ...style }}>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : undefined} style={{ fontWeight: "var(--weight-bold)", fontSize: 14, color: "var(--text-primary)" }}>{label}</label>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, minHeight: 48, padding: "0 12px", background: "var(--surface-card)",
          border: error ? "2px solid var(--status-error-text)" : hover || focus ? "var(--border-doodle)" : "2px solid var(--border-subtle)", borderRadius: "var(--radius-control)",
          outline: focus ? "2px solid var(--focus-ring)" : "none", outlineOffset: 2, transition: "border-color var(--duration-hover) var(--ease-out)" }}>
        {icon ? <Icon name={icon} size={20} style={{ color: "var(--text-secondary)" }} /> : null}
        <input id={inputId} type={type} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} aria-invalid={error ? true : undefined}
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "transparent", fontSize: 16, padding: "10px 0", color: "var(--text-primary)" }} {...rest} />
        {trailing}
      </div>
      {error ? <p role="alert" style={{ margin: 0, fontSize: 14, color: "var(--status-error-text)", display: "flex", gap: 6, alignItems: "center" }}><Icon name="error" size={20} />{error}</p>
        : hint ? <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>{hint}</p> : null}
    </div>
  );
}
