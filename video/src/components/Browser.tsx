import React from "react";
import { theme } from "../styles/theme";

type BrowserProps = {
  children: React.ReactNode;
  url?: string;
  scale?: number;
};

export const Browser: React.FC<BrowserProps> = ({
  children,
  url = "blog.example.com/article",
  scale = 1,
}) => {
  return (
    <div
      style={{
        width: 1200 * scale,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${theme.border}`,
        backgroundColor: theme.surface,
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: theme.surfaceLight,
          borderBottom: `1px solid ${theme.border}`,
          gap: 8,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 8, marginRight: 12 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#febc2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#28c840",
            }}
          />
        </div>
        {/* URL bar */}
        <div
          style={{
            flex: 1,
            backgroundColor: theme.surface,
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            fontFamily: theme.fontFamily,
            color: theme.textMuted,
          }}
        >
          {url}
        </div>
      </div>
      {/* Content */}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};
