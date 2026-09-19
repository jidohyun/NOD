import React from "react";
import { Brand } from "../../components/navigation/Brand.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { Icon } from "../../components/actions/Icon.jsx";
import { InfoCard } from "../../components/display/InfoCard.jsx";
import { Library } from "./Library.jsx";

const wrap = { width: "min(var(--max-landing), calc(100% - 2 * var(--gutter-desktop)))", margin: "0 auto" };
const dashed = { borderTop: "2px dashed var(--border-subtle)", width: "80%", margin: "0 auto" };

function useReveal() {
  React.useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { els.forEach((e) => e.setAttribute("data-reveal", "in")); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.setAttribute("data-reveal", "in"); io.unobserve(en.target); } }), { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}
const Reveal = ({ delay = 0, children, style }) => (
  <div data-reveal="out" style={{ transition: `opacity 500ms var(--ease-out) ${delay}ms, transform 500ms var(--ease-out) ${delay}ms`, ...style }}>{children}</div>
);

const Step = ({ n, children }) => (
  <li style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.6, color: "var(--text-primary)" }}>
    <span aria-hidden="true" style={{ flex: "0 0 auto", width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: "var(--radius-pill)", background: "var(--color-brand)", border: "var(--border-doodle)", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14 }}>{n}</span>
    <span>{children}</span>
  </li>
);

export function LandingFull({ onLogin }) {
  useReveal();
  return (
    <div className="nod-dots" style={{ minHeight: "100dvh", overflowX: "hidden" }}>
      <style>{"[data-reveal='out']{opacity:0;transform:translateY(24px)} [data-reveal='in']{opacity:1;transform:none}"}</style>

      <header style={{ ...wrap, minHeight: 80, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Brand />
        <nav aria-label="페이지 내 이동" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="#preview" style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, textDecoration: "none", color: "var(--text-primary)", borderRadius: "var(--radius-control)" }}>어떻게 보이나요</a>
          <a href="#extension" style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, textDecoration: "none", color: "var(--text-primary)", borderRadius: "var(--radius-control)" }}>확장 프로그램</a>
          <Button size="sm" icon="login" onClick={onLogin}>Google로 시작하기</Button>
        </nav>
      </header>

      <main>
        <section aria-labelledby="hero-title" style={{ ...wrap, padding: "clamp(48px, 10vh, 112px) 0 96px", display: "grid", gridTemplateColumns: "minmax(0, 7fr) minmax(300px, 5fr)", alignItems: "center", gap: "clamp(40px, 6vw, 96px)" }}>
          <div>
            <Reveal><p style={{ margin: "0 0 20px", display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "var(--surface-mint)", border: "var(--border-doodle)", borderRadius: "var(--radius-pill)", fontSize: 14, fontWeight: 700, transform: "rotate(-1.25deg)" }}><Icon name="bookmark_add" size={20} />나만의 링크 보관함</p></Reveal>
            <Reveal delay={80}><h1 id="hero-title" style={{ fontSize: "var(--text-hero)", lineHeight: "var(--leading-hero)", fontWeight: 700, maxWidth: 720 }}>읽고 싶은 순간을 놓치지 마세요.</h1></Reveal>
            <Reveal delay={160}><p style={{ maxWidth: 540, margin: "24px 0 32px", fontSize: "var(--text-body-lg)", lineHeight: 1.6, color: "var(--text-secondary)" }}>NOD는 나중에 다시 볼 웹페이지를 조용히 모아두는 개인 링크 라이브러리입니다. Chrome 툴바에서 한 번 누르면 저장되고, 필요할 때 제목과 출처로 찾아 다시 엽니다.</p></Reveal>
            <Reveal delay={240}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <Button size="lg" icon="login" onClick={onLogin}>Google로 시작하기</Button>
                <Button variant="secondary" size="lg" iconAfter="arrow_downward" href="#preview">어떻게 보이나요</Button>
              </div>
              <p style={{ margin: "16px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>Google 계정으로 안전하게 로그인합니다. 저장하는 정보는 URL, 제목, 출처, 저장 시각뿐입니다.</p>
            </Reveal>
          </div>
          <Reveal delay={200} style={{ position: "relative" }}>
            <span aria-hidden="true" style={{ position: "absolute", top: -36, right: -24, width: 120, height: 120, background: "var(--color-brand)", borderRadius: "var(--radius-organic)", opacity: 0.9 }}></span>
            <span aria-hidden="true" style={{ position: "absolute", bottom: -28, left: -32, width: 80, height: 80, background: "var(--surface-lavender)", border: "var(--border-doodle)", borderRadius: "var(--radius-blob)", transform: "rotate(6deg)" }}></span>
            <InfoCard icon="extension" iconTint="var(--surface-mint)" title="탭에서 바로 저장" padding="40px" tilt={1.25} style={{ position: "relative", maxWidth: 520 }}>
              <p style={{ margin: "0 0 20px" }}>읽고 있는 페이지를 떠나지 않고 Chrome 툴바에서 한 번에 보관하세요.</p>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14 }}>
                <Step n="1">Chrome에 NOD 확장 프로그램을 추가합니다.</Step>
                <Step n="2">툴바의 NOD 아이콘에서 Google 로그인으로 연결합니다.</Step>
                <Step n="3">저장할 탭에서 아이콘을 누르면 링크가 바로 추가됩니다.</Step>
              </ol>
            </InfoCard>
          </Reveal>
        </section>

        <div style={dashed}></div>

        <section id="preview" aria-labelledby="preview-title" style={{ ...wrap, padding: "96px 0", scrollMarginTop: 24 }}>
          <div style={{ maxWidth: 640, margin: "0 auto 48px", textAlign: "center" }}>
            <Reveal><span style={{ display: "inline-block", padding: "6px 14px", background: "var(--surface-selected)", border: "var(--border-doodle)", borderRadius: "var(--radius-doodle)", fontSize: 14, fontWeight: 700, color: "var(--text-accent)" }}>저장한 링크</span></Reveal>
            <Reveal delay={80}><h2 id="preview-title" style={{ margin: "20px 0 16px", fontSize: "var(--text-section)", lineHeight: 1.2, fontWeight: 700 }}>목록, 검색, 원문 열기, 삭제. 그게 전부입니다.</h2></Reveal>
            <Reveal delay={160}><p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: "var(--text-secondary)" }}>본문을 수집하거나 요약하지 않습니다. 저장한 링크를 제목과 출처로 빠르게 찾아 새 탭에서 엽니다.</p></Reveal>
          </div>
          <Reveal delay={200}>
            <div aria-label="라이브러리 화면 미리보기" style={{ position: "relative", maxWidth: 1080, margin: "0 auto", transform: "rotate(-1deg)" }}>
              <span aria-hidden="true" style={{ position: "absolute", top: -40, left: -40, width: 140, height: 140, background: "var(--surface-mint)", borderRadius: "var(--radius-blob)", zIndex: 0 }}></span>
              <span aria-hidden="true" style={{ position: "absolute", bottom: -36, right: -30, width: 96, height: 96, background: "var(--color-brand)", border: "var(--border-doodle)", borderRadius: "var(--radius-organic)", zIndex: 0, transform: "rotate(8deg)" }}></span>
              <div style={{ position: "relative", zIndex: 1, border: "var(--border-doodle-emphasis)", borderRadius: "var(--radius-doodle-thick)", boxShadow: "var(--shadow-sketch-large)", overflow: "hidden", background: "var(--surface-page)", pointerEvents: "none" }}>
                <div style={{ height: 560, overflow: "hidden" }}><div style={{ transform: "scale(0.82)", transformOrigin: "top left", width: "121.95%" }}>
                  <Library user={{ name: "지도현", email: "dnp@dnp.im" }} state="ready" articles={[
                    { id: 1, title: "Manifest V3 migration guide", hostname: "developer.chrome.com", url: "https://developer.chrome.com/docs/extensions/develop/migrate", savedAt: "2026년 9월 13일" },
                    { id: 2, title: "Cloudflare D1: 서버리스 SQL 데이터베이스 시작하기", hostname: "developers.cloudflare.com", url: "https://developers.cloudflare.com/d1/get-started/", savedAt: "2026년 9월 12일" },
                    { id: 3, title: "브라우저 확장 프로그램으로 읽을 페이지를 저장하는 가장 단순한 방법", hostname: "web.dev", url: "https://web.dev/articles/save-for-later", savedAt: "2026년 9월 10일" },
                  ]} />
                </div></div>
                <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 160, background: "linear-gradient(to bottom, rgba(255,253,250,0), var(--surface-page))" }}></div>
              </div>
            </div>
          </Reveal>
        </section>

        <div style={dashed}></div>

        <section id="extension" aria-labelledby="cta-title" style={{ ...wrap, padding: "96px 0 128px", scrollMarginTop: 24 }}>
          <div style={{ position: "relative", maxWidth: 800, margin: "0 auto", textAlign: "center", padding: "64px 40px", border: "3px dashed var(--color-brand)", borderRadius: "var(--radius-organic)", background: "rgba(255,255,255,0.6)" }}>
            <span aria-hidden="true" style={{ position: "absolute", top: -28, right: 60, width: 56, height: 56, background: "var(--color-coral)", borderRadius: "var(--radius-blob)", opacity: 0.8 }}></span>
            <Reveal><h2 id="cta-title" style={{ fontSize: "var(--text-section)", lineHeight: 1.15, fontWeight: 700 }}>오늘 읽은 페이지,<br />한 번 눌러 보관하세요.</h2></Reveal>
            <Reveal delay={80}><p style={{ maxWidth: 480, margin: "20px auto 32px", fontSize: 18, lineHeight: 1.6, color: "var(--text-secondary)" }}>Google 계정으로 로그인하고 Chrome 확장 프로그램을 연결하면 바로 시작할 수 있습니다.</p></Reveal>
            <Reveal delay={160}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                <Button size="lg" icon="login" onClick={onLogin}>Google로 시작하기</Button>
                <Button variant="mint" size="lg" icon="extension" href="#" >Chrome 확장 프로그램 추가</Button>
              </div>
              <p style={{ margin: "16px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>Chrome 웹스토어 링크는 배포 후 연결됩니다.</p>
            </Reveal>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "2px dashed var(--border-subtle)" }}>
        <div style={{ ...wrap, padding: "48px 0 40px", display: "grid", justifyItems: "center", gap: 20, textAlign: "center" }}>
          <Brand size={24} />
          <p style={{ margin: 0, maxWidth: 420, fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>나중에 다시 볼 웹페이지를 저장하고 찾아 여는 개인 링크 라이브러리.</p>
          <nav aria-label="바닥글" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 24px" }}>
            {[["확장 프로그램", "#extension"], ["GitHub", "https://github.com/jidohyun/NOD"], ["개인정보 처리방침", "#"], ["이용약관", "#"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 14, fontWeight: 700, textDecoration: "none", color: "var(--text-primary)" }}>{l}</a>
            ))}
          </nav>
          <p style={{ margin: 0, paddingTop: 20, width: "100%", borderTop: "2px dashed var(--border-subtle)", fontSize: 12, color: "var(--text-secondary)" }}>© 2026 NOD</p>
        </div>
      </footer>
    </div>
  );
}
