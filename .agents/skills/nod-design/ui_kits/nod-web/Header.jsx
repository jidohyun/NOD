import React from "react";
import { Brand } from "../../components/navigation/Brand.jsx";
import { IconButton } from "../../components/actions/IconButton.jsx";
export function Header({ user, onLogout }) {
  return (
    <header style={{ width: "min(var(--max-app), calc(100% - 2 * var(--gutter-desktop)))", margin: "0 auto", minHeight: 80, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <Brand />
      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span aria-hidden="true" style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "var(--radius-blob)", background: "var(--surface-lavender)", border: "var(--border-doodle)", fontFamily: "var(--font-brand)", fontWeight: 700 }}>{(user.name || "N").slice(0, 1).toUpperCase()}</span>
          <span style={{ minWidth: 0, display: "grid" }}>
            <span style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{user.name}</span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{user.email}</span>
          </span>
          <IconButton icon="logout" label="로그아웃" onClick={onLogout} />
        </div>
      ) : null}
    </header>
  );
}
