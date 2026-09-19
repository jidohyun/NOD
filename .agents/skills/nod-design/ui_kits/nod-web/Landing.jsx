import React from "react";
import { Header } from "./Header.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { InfoCard } from "../../components/display/InfoCard.jsx";
import { Icon } from "../../components/actions/Icon.jsx";
const Step = ({ n, children }) => (
  <li style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.6, color: "var(--text-primary)" }}>
    <span aria-hidden="true" style={{ flex: "0 0 auto", width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: "var(--radius-pill)", background: "var(--color-brand)", border: "var(--border-doodle)", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14 }}>{n}</span>
    <span>{children}</span>
  </li>
);
export function Landing({ message = "Google 계정으로 안전하게 로그인합니다.", onLogin }) {
  return (
    <div className="nod-dots" style={{ minHeight: "100dvh" }}>
      <Header />
      <main style={{ width: "min(var(--max-landing), calc(100% - 2 * var(--gutter-desktop)))", margin: "0 auto", padding: "clamp(48px, 10vh, 112px) 0 64px", display: "grid", gridTemplateColumns: "minmax(0, 7fr) minmax(300px, 5fr)", alignItems: "center", gap: "clamp(40px, 6vw, 96px)" }}>
        <section aria-labelledby="landing-title" style={{ display: "grid", gap: 0 }}>
          <p style={{ margin: "0 0 16px", display: "inline-flex", width: "fit-content", alignItems: "center", gap: 8, padding: "6px 14px", background: "var(--surface-mint)", border: "var(--border-doodle)", borderRadius: "var(--radius-pill)", fontSize: 14, fontWeight: 700, transform: "rotate(-1.25deg)" }}><Icon name="bookmark_add" size={20} />나만의 링크 보관함</p>
          <h1 id="landing-title" style={{ fontSize: "var(--text-hero)", lineHeight: "var(--leading-hero)", fontWeight: 700, maxWidth: 680, whiteSpace: "pre-line" }}>{"읽고 싶은 순간을\n놓치지 마세요."}</h1>
          <p style={{ maxWidth: 520, margin: "24px 0 32px", fontSize: "var(--text-body-lg)", lineHeight: 1.6, color: "var(--text-secondary)" }}>NOD는 나중에 다시 볼 웹페이지를 조용히 모아두는 개인 링크 라이브러리입니다.</p>
          <div><Button size="lg" icon="login" onClick={onLogin}>Google로 시작하기</Button></div>
          <p style={{ margin: "16px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>{message}</p>
        </section>
        <div style={{ position: "relative" }}>
          <span aria-hidden="true" style={{ position: "absolute", top: -36, right: -24, width: 120, height: 120, background: "var(--color-brand)", borderRadius: "var(--radius-organic)", opacity: 0.9, animation: "nod-float var(--float-period) ease-in-out infinite" }}></span>
          <span aria-hidden="true" style={{ position: "absolute", bottom: -28, left: -32, width: 80, height: 80, background: "var(--surface-lavender)", border: "var(--border-doodle)", borderRadius: "var(--radius-blob)", transform: "rotate(6deg)" }}></span>
          <InfoCard icon="extension" iconTint="var(--surface-mint)" title="탭에서 바로 저장" padding="40px" tilt={1.25} style={{ position: "relative", maxWidth: 520 }}>
            <p style={{ margin: "0 0 20px" }}>읽고 있는 페이지를 떠나지 않고 Chrome 툴바에서 한 번에 보관하세요.</p>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14 }}>
              <Step n="1">Chrome에 NOD 확장 프로그램을 추가합니다.</Step>
              <Step n="2">툴바의 NOD 아이콘에서 Google 로그인으로 연결합니다.</Step>
              <Step n="3">저장할 탭에서 아이콘을 누르면 링크가 바로 추가됩니다.</Step>
            </ol>
          </InfoCard>
        </div>
      </main>
    </div>
  );
}
