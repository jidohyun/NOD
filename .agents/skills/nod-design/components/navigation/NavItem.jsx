import React from "react";
import { Icon } from "../actions/Icon.jsx";
export function NavItem({ icon, label, selected = false, href = "#", onClick, style }) {
  const [h, setH] = React.useState(false);
  return (
    <a href={href} onClick={onClick} aria-current={selected ? "page" : undefined} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44, padding: "0 14px", borderRadius: "var(--radius-control)", textDecoration: "none",
        fontWeight: "var(--weight-bold)", fontSize: 16, color: "var(--text-primary)",
        background: selected ? "var(--surface-selected)" : h ? "var(--surface-subtle)" : "transparent",
        border: selected ? "var(--border-dashed)" : "2px dashed transparent", transition: "background var(--duration-hover) var(--ease-out)", ...style }}>
      <Icon name={icon} size={24} fill={selected ? 1 : 0} />
      <span>{label}</span>
    </a>
  );
}
