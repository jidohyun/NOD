import React from "react";
import { Icon } from "./Icon.jsx";
const base = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
  minHeight: 44, padding: "0 20px", fontFamily: "var(--font-body)", fontWeight: "var(--weight-bold)",
  fontSize: 16, lineHeight: 1.2, textDecoration: "none", cursor: "pointer", whiteSpace: "nowrap",
  transition: "background var(--duration-hover) var(--ease-out), color var(--duration-hover) var(--ease-out), box-shadow var(--duration-hover) var(--ease-out), transform var(--duration-fast) var(--ease-out)",
};
const variants = {
  primary: { background: "var(--action-primary-bg)", color: "var(--action-primary-text)", border: "var(--border-doodle-emphasis)", borderRadius: "var(--radius-doodle)", boxShadow: "var(--shadow-sketch)" },
  secondary: { background: "var(--action-secondary-bg)", color: "var(--action-secondary-text)", border: "var(--border-doodle)", borderRadius: "var(--radius-doodle)" },
  mint: { background: "var(--action-secondary-alt-bg)", color: "var(--action-secondary-text)", border: "var(--border-doodle)", borderRadius: "var(--radius-doodle)" },
  plain: { background: "var(--action-secondary-bg)", color: "var(--action-secondary-text)", border: "var(--border-doodle)", borderRadius: "var(--radius-control)" },
  text: { background: "transparent", color: "var(--text-accent)", border: "2px solid transparent", borderRadius: "var(--radius-control)", padding: "0 8px", minHeight: 40 },
};
const hover = {
  primary: { background: "var(--action-primary-hover-bg)", color: "var(--action-primary-hover-text)", boxShadow: "var(--shadow-sketch-hover)" },
  secondary: { boxShadow: "var(--shadow-sketch)" }, mint: { boxShadow: "var(--shadow-sketch)" }, plain: { background: "var(--surface-subtle)" },
  text: { textDecoration: "underline" },
};
export function Button({ variant = "primary", size = "md", icon, iconAfter, loading = false, disabled = false, children, href, style, ...rest }) {
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  const off = disabled || loading;
  const sizeStyle = size === "sm" ? { minHeight: 36, padding: "0 14px", fontSize: 14 } : size === "lg" ? { minHeight: 52, padding: "0 28px", fontSize: 18 } : {};
  const s = { ...base, ...variants[variant], ...sizeStyle, ...(h && !off ? hover[variant] : {}), ...(p && !off ? { transform: "translate(2px,2px)", boxShadow: "none" } : {}), ...(off ? { opacity: 0.55, cursor: loading ? "wait" : "not-allowed" } : {}), ...style };
  const Tag = href ? "a" : "button";
  return (
    <Tag href={href} disabled={!href && off} aria-disabled={off || undefined} aria-busy={loading || undefined} style={s}
      onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setP(false); }} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} {...rest}>
      {loading ? <Icon name="progress_activity" size={20} style={{ animation: "nod-spin 1s linear infinite" }} /> : icon ? <Icon name={icon} size={20} /> : null}
      <span>{children}</span>
      {iconAfter ? <Icon name={iconAfter} size={20} /> : null}
    </Tag>
  );
}
