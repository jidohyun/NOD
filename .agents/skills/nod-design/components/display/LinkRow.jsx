import React from "react";
import { IconButton } from "../actions/IconButton.jsx";
export function LinkRow({ title, hostname, url, savedAt, onDelete, deleting = false, style }) {
  const [h, setH] = React.useState(false);
  return (
    <li onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ listStyle: "none", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "start", padding: "16px 20px", background: "var(--surface-card)",
        border: h ? "var(--border-doodle)" : "2px solid var(--border-subtle)", borderRadius: "var(--radius-doodle)", boxShadow: h ? "var(--shadow-sketch)" : "none",
        transition: "border-color var(--duration-hover) var(--ease-out), box-shadow var(--duration-hover) var(--ease-out)", ...style }}>
      <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-link-title)", lineHeight: "var(--leading-link)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)", textDecoration: h ? "underline" : "none",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</a>
        <p style={{ margin: 0, display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: "var(--text-meta)", lineHeight: "var(--leading-meta)", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: "var(--weight-bold)" }}>{hostname}</span><span>{savedAt}</span>
        </p>
        <span style={{ fontSize: "var(--text-meta-sm)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
      </div>
      <IconButton icon="delete" label={`“${title}” 삭제`} tone="danger" onClick={onDelete} disabled={deleting} />
    </li>
  );
}
