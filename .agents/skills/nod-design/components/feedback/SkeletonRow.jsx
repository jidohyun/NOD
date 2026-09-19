import React from "react";
/** Loading placeholder matching LinkRow height. */
export function SkeletonRow({ style }) {
  const bar = (w, h = 14) => <span style={{ display: "block", width: w, height: h, borderRadius: 6, background: "var(--surface-subtle)" }}></span>;
  return (
    <li aria-hidden="true" style={{ listStyle: "none", display: "grid", gap: 10, padding: "16px 20px", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-doodle)", background: "var(--surface-card)", opacity: 0.8, ...style }}>
      {bar("70%", 18)}{bar("35%")}{bar("55%", 12)}
    </li>
  );
}
