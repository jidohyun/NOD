import React from "react";
import { Brand } from "../../components/navigation/Brand.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { LinkRow } from "../../components/display/LinkRow.jsx";
import { TextInput } from "../../components/forms/TextInput.jsx";
import { IconButton } from "../../components/actions/IconButton.jsx";
import { createProgress, map, REDUCED, startLenis } from "./scroll.js";

/* Rules kept from uploads/saas-landing-anti-slop-principles.md: one thesis, one signature motion, no shadows/cards/gradients,
   hairlines only, caption style, yellow budget ×3 (hero settle, hero CTA, closing CTA), doodle border ×2 (settled card, closing CTA). */
const INK = "#1A1A1A";
const HAIR = "1px solid rgba(26,26,26,0.14)";
const wrap = { width: "100%", maxWidth: 1280, margin: "0 auto", paddingLeft: "var(--gutter-desktop)", paddingRight: "var(--gutter-desktop)" };
const CAP = { fontFamily: "var(--landing-body)", fontSize: "0.7rem", letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, color: "#6B665C", fontVariantNumeric: "tabular-nums", margin: 0 };
const DISPLAY = { fontFamily: "var(--landing-display)", fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.01em", margin: 0, wordBreak: "keep-all", color: INK };
const NUM = { fontFamily: "var(--landing-display)", fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", lineHeight: 0.9, margin: 0 };
const ctaPlain = { boxShadow: "none", borderRadius: 8, border: "2px solid " + INK, fontFamily: "var(--landing-body)" };
const ctaDoodle = { boxShadow: "none", fontFamily: "var(--landing-body)" };

function useProgress(sectionRef, mode, fn, deps = []) {
  React.useEffect(() => {
    const el = sectionRef.current; if (!el) return;
    const p = createProgress(el, mode); const off = p.on(fn);
    return () => { off(); p.destroy(); };
  }, deps);
}

/* ---------- Hero: 12 pieces of other apps' clutter peel off in three tiers; 4 lines remain ---------- */
const chip = (t, extra) => <span style={{ display: "inline-block", padding: "3px 10px", border: HAIR, borderRadius: 999, fontSize: 12, color: "#6B665C", background: "var(--surface-card)", ...extra }}>{t}</span>;
const TAGS = ["chrome", "extension", "mv3", "migration", "javascript", "web", "later"];
// tier: heavy (fall + rotate, slow) · light (scatter, fast) · status (fade + shrink in place)
const CLUTTER = [
  { key: "ai", tier: "heavy", node: <div style={{ display: "grid", gap: 6, padding: 12, border: HAIR, borderRadius: 6, fontSize: 13, lineHeight: 1.5, color: "#6B665C", background: "var(--surface-card)" }}><span style={CAP}>AI 요약</span><span>Manifest V3는 백그라운드 페이지를 서비스 워커로 대체하며, 원격 코드 실행을 금지합니다.</span><span>확장 프로그램은 declarativeNetRequest로 요청을 처리해야 하며…</span><span>마이그레이션 기한은 2024년 6월로 예정되어…</span></div> },
  { key: "rec", tier: "heavy", node: <div style={{ display: "grid", gap: 6, fontSize: 13, color: "#6B665C" }}><span style={CAP}>추천 아티클</span><span>Service workers in extensions</span><span>Migrating from background pages</span><span>Chrome extension security model</span></div> },
  { key: "notes", tier: "heavy", node: <div style={{ fontSize: 13, color: "#6B665C", borderLeft: "2px solid rgba(26,26,26,0.14)", paddingLeft: 10 }}>메모: 나중에 팀에 공유할 것</div> },
  { key: "hl", tier: "heavy", node: <div style={{ display: "grid", gap: 6, fontSize: 14, lineHeight: 1.5 }}><span style={{ background: "rgba(26,26,26,0.08)", padding: "2px 4px" }}>“서비스 워커는 필요할 때만 실행된다”</span><span style={{ background: "rgba(26,26,26,0.08)", padding: "2px 4px" }}>“원격 호스팅 코드는 더 이상 허용되지 않는다”</span></div> },
  { key: "tags", tier: "light", node: <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{TAGS.map((t, i) => <span key={t} data-chip={i} style={{ display: "inline-block", willChange: "transform, opacity" }}>{chip("#" + t)}</span>)}</div> },
  { key: "stars", tier: "light", node: <div style={{ fontSize: 14, letterSpacing: 2, color: "#6B665C" }}>★★★★☆</div> },
  { key: "share", tier: "light", node: <div style={{ display: "flex", gap: 6 }}>{["공유", "메일", "Slack", "복사"].map((t, i) => <span key={t} data-chip={i} style={{ display: "inline-block", willChange: "transform, opacity" }}>{chip(t)}</span>)}</div> },
  { key: "author", tier: "light", node: <div style={{ fontSize: 13, color: "#6B665C" }}>작성자 · Chrome Developers · 12,304명 저장</div> },
  { key: "unread", tier: "status", node: <div>{chip("읽지 않음 47", { fontWeight: 700 })}</div> },
  { key: "prog", tier: "status", node: <div style={{ display: "grid", gap: 4, fontSize: 12, color: "#6B665C" }}><span>읽음 34%</span><span style={{ height: 4, background: "rgba(26,26,26,0.1)" }}><span style={{ display: "block", width: "34%", height: "100%", background: "#6B665C" }}></span></span></div> },
  { key: "time", tier: "status", node: <div style={{ fontSize: 13, color: "#6B665C" }}>읽는 데 12분</div> },
  { key: "folder", tier: "status", node: <div style={{ fontSize: 13, color: "#6B665C" }}>Inbox / Tech / Later</div> },
];
// progress windows per piece: heavy 0.00–0.35 (0.12 each, overlapping), light 0.35–0.60 (0.04 each), status 0.60–0.80
const WINDOWS = (() => {
  const w = {}; const heavy = CLUTTER.filter((c) => c.tier === "heavy"), light = CLUTTER.filter((c) => c.tier === "light"), status = CLUTTER.filter((c) => c.tier === "status");
  heavy.forEach((c, i) => { const s0 = (0.35 - 0.12) * (i / (heavy.length - 1)); w[c.key] = [s0, s0 + 0.12]; });
  light.forEach((c, i) => { const s0 = 0.35 + (0.27 - 0.07) * (i / (light.length - 1)); w[c.key] = [s0, s0 + 0.07]; });   // 0.35–0.62, each 0.07, ~0.03 overlap
  status.forEach((c, i) => { const s0 = 0.62 + (0.18 - 0.06) * (i / (status.length - 1)); w[c.key] = [s0, s0 + 0.06]; }); // 0.62–0.80
  return w;
})();
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const DOODLE_PATH = "M 8 6 C 200 2, 420 10, 632 6 C 640 90, 636 200, 632 300 C 420 306, 200 298, 8 302 C 4 200, 6 90, 8 6 Z";

function Hero({ onLogin }) {
  const ref = React.useRef(null), card = React.useRef(null), saved = React.useRef(null), title = React.useRef(null);
  const capLabel = React.useRef(null), capNum = React.useRef(null), stroke = React.useRef(null), svg = React.useRef(null);
  const pieces = React.useRef({});
  const measure = React.useRef({ baseH: 0, h: {} });
  const smooth = React.useRef({ fit: 1, target: 1, raf: 0, v: 0 });
  const capText = React.useRef("other");
  const paintCard = () => {
    const { v, fit } = smooth.current;
    const scaleSnap = 1 - 0.03 * (1 - easeOut(map(v, [0.78, 0.82], [0, 1]))) * map(v, [0.77, 0.78], [0, 1]); // 1 → dips to 0.97 at 0.78 → back to 1 at 0.82
    const rot = -1.25 * easeOut(map(v, [0.82, 0.92], [0, 1]));
    if (card.current) {
      card.current.style.transform = REDUCED ? "none" : `scale(${fit * scaleSnap}) rotate(${rot}deg)`;
      card.current.style.transformOrigin = "top center";
    }
  };
  const tick = () => {
    const sm = smooth.current;
    sm.fit += (sm.target - sm.fit) * 0.18;
    paintCard();
    if (Math.abs(sm.target - sm.fit) > 0.0005) sm.raf = requestAnimationFrame(tick); else { sm.fit = sm.target; paintCard(); sm.raf = 0; }
  };
  const apply = (v) => {
    let remaining = CLUTTER.length;
    let targetH = measure.current.baseH;
    CLUTTER.forEach((c, idx) => {
      const el = pieces.current[c.key]; if (!el) return;
      const [s0, s1] = WINDOWS[c.key];
      const t = map(v, [s0, s1], [0, 1]);
      if (t >= 0.5) remaining -= 1;
      const h = measure.current.h[c.key] || 0;
      const collapse = easeInOut(map(t, [0.55, 1], [0, 1]));   // hold space while falling, then close smoothly
      targetH += (h + 16) * (1 - collapse);
      el.style.pointerEvents = "none";
      el.style.maxHeight = (h * (1 - collapse)) + "px";
      el.style.marginBottom = (16 * (1 - collapse)) + "px";
      const dir = idx % 2 ? 1 : -1;
      if (REDUCED) { el.style.opacity = String(1 - t); el.style.transform = "none"; return; }
      if (c.tier === "heavy") {
        const e = easeIn(t);
        el.style.opacity = String(1 - map(t, [0.25, 0.85], [0, 1]));
        el.style.transform = `translate3d(${dir * 18 * e}px, ${110 * e}px, 0) rotate(${dir * 5 * e}deg)`;
      } else if (c.tier === "light") {
        const chips = el.querySelectorAll("[data-chip]");
        if (chips.length) {
          el.style.opacity = "1"; el.style.transform = "none";
          chips.forEach((ch, i) => {
            const ct = map(t, [i / chips.length * 0.6, i / chips.length * 0.6 + 0.4], [0, 1]); const e = easeOut(ct);
            const d = i % 2 ? 1 : -1;
            ch.style.opacity = String(1 - ct); ch.style.transform = `translate3d(${d * (40 + i * 10) * e}px, ${-(30 + i * 6) * e}px, 0) rotate(${d * 12 * e}deg)`;
          });
        } else {
          const e = easeOut(t);
          el.style.opacity = String(1 - t); el.style.transform = `translate3d(${dir * 60 * e}px, ${-24 * e}px, 0)`;
        }
      } else {
        el.style.opacity = String(1 - t); el.style.transform = `scale(${1 - 0.1 * t})`; el.style.transformOrigin = "left center";
      }
    });
    // caption: fade out 0.78–0.81, swap text at 0.81, fade in 0.81–0.84
    const want = v >= 0.81 ? "nod" : "other";
    if (capLabel.current) {
      if (want !== capText.current) { capText.current = want; capLabel.current.textContent = want === "nod" ? "NOD가 저장하는 것" : "다른 앱이 링크 하나에 붙이는 것"; }
      capLabel.current.style.opacity = String(1 - map(v, [0.78, 0.81], [0, 1]) + map(v, [0.81, 0.84], [0, 1]));
    }
    if (capNum.current) capNum.current.textContent = String(want === "nod" ? 4 : remaining).padStart(2, "0");
    // hairline fades out 0.80–0.86 while the doodle stroke fades in 0.82–0.86 and draws 0.82–0.92
    const hairA = map(v, [0.8, 0.86], [0.14, 0]);
    if (card.current) card.current.style.border = `1px solid rgba(26,26,26,${hairA.toFixed(3)})`;
    if (svg.current) svg.current.style.opacity = String(map(v, [0.82, 0.86], [0, 1]));
    const drawn = easeOut(map(v, [0.82, 0.92], [0, 1]));
    if (stroke.current) { const len = stroke.current.getTotalLength ? stroke.current.getTotalLength() : 2000; stroke.current.style.strokeDasharray = String(len); stroke.current.style.strokeDashoffset = String(len * (1 - drawn)); }
    const lit = map(v, [0.92, 1], [0, 1]);
    if (saved.current) saved.current.style.opacity = String(lit);
    if (title.current) title.current.style.opacity = String(lit);
    // fit scale: analytic height, exponentially smoothed in a rAF loop (no scrollHeight reads per frame)
    const sm = smooth.current; sm.v = v;
    if (card.current && card.current.parentElement) {
      const avail = window.innerHeight - card.current.parentElement.getBoundingClientRect().top - 24;
      sm.target = Math.max(0.8, Math.min(1, avail / Math.max(1, targetH)));
    }
    paintCard();
    if (!sm.raf) sm.raf = requestAnimationFrame(tick);
  };
  React.useLayoutEffect(() => {
    const h = {}; let sum = 0;
    Object.entries(pieces.current).forEach(([k, el]) => { if (el) { h[k] = el.scrollHeight; sum += el.scrollHeight + 16; } });
    measure.current = { h, baseH: card.current ? card.current.scrollHeight - sum : 0 };
    smooth.current.fit = 1;
    return () => cancelAnimationFrame(smooth.current.raf);
  }, []);
  React.useEffect(() => { window.__heroProgress = apply; return () => { delete window.__heroProgress; }; }, []);
  useProgress(ref, "pin", apply);
  return (
    <section ref={ref} aria-labelledby="hero-title" style={{ position: "relative", height: "220vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100dvh", overflow: "hidden", display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", alignItems: "start" }}>
        <div style={{ ...wrap, paddingTop: "13vh", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 24, alignItems: "end" }}>
          <div>
            <p style={CAP}>NOD — 개인 링크 라이브러리</p>
            <h1 id="hero-title" style={{ ...DISPLAY, fontSize: "clamp(1.8rem, 4.2vw, 4rem)", marginTop: 14, overflowWrap: "anywhere" }}>요약은 필요 없습니다.<br />자리만 있으면 됩니다.</h1>
          </div>
          <Button size="lg" onClick={onLogin} style={ctaPlain}>Google로 시작하기</Button>
        </div>
        <div style={{ ...wrap, alignSelf: "start", display: "grid", justifyItems: "center", paddingTop: 28, minHeight: 0 }}>
          <div style={{ width: "min(640px, 100%)", display: "grid", gap: 12 }}>
            <p aria-live="polite" style={{ ...CAP, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span ref={capLabel}>다른 앱이 링크 하나에 붙이는 것</span>
              <span ref={capNum} style={{ ...CAP, color: INK, fontSize: "1rem", letterSpacing: "0.1em" }}>12</span>
            </p>
            <div ref={card} aria-hidden="true" style={{ background: "var(--surface-card)", border: HAIR, borderRadius: 8, padding: "24px 28px", position: "relative", willChange: "transform" }}>
              {/* doodle border drawn by stroke-dashoffset at settle */}
              <svg ref={svg} viewBox="0 0 640 308" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: -4, width: "calc(100% + 8px)", height: "calc(100% + 8px)", opacity: 0, pointerEvents: "none", overflow: "visible" }}>
                <path ref={stroke} d={DOODLE_PATH} fill="none" stroke="var(--color-brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
              <span ref={saved} style={{ ...CAP, color: INK, position: "absolute", top: 26, right: 28, opacity: 0 }}>저장됨</span>
              <div style={{ display: "grid", gap: 6, marginBottom: 20 }}>
                <span style={{ fontSize: 13, color: "#6B665C", fontVariantNumeric: "tabular-nums" }}>https://developer.chrome.com/docs/extensions/develop/migrate</span>
                <span style={{ ...DISPLAY, fontSize: 24, lineHeight: 1.3 }}>Manifest V3 migration guide</span>
                <span style={{ fontSize: 14, color: "#6B665C" }}>developer.chrome.com</span>
                <span style={{ fontSize: 14, color: "#6B665C", fontVariantNumeric: "tabular-nums" }}>2026년 9월 13일</span>
              </div>
              <div>
                {CLUTTER.map((c) => (
                  <div key={c.key} ref={(el) => (pieces.current[c.key] = el)} style={{ overflow: "visible", marginBottom: 16, willChange: "transform, opacity" }}>{c.node}</div>
                ))}
              </div>
            </div>
            <p ref={title} style={{ ...CAP, marginTop: 8, opacity: 0, color: INK, textAlign: "center" }}>URL · 제목 · 출처 · 저장 시각 — 이 넷이 전부입니다</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Not doing: struck list (5 cols) vs what remains (7 cols) ---------- */
const NOT = ["요약", "태그", "폴더", "추천", "읽음 상태", "하이라이트", "읽는 시간"];
function NotDoing() {
  return (
    <section aria-labelledby="not-title" style={{ borderTop: HAIR }}>
      <div style={{ ...wrap, paddingTop: 112, paddingBottom: 112, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 24, alignItems: "start" }}>
        <div style={{ gridColumn: "1 / 6", display: "grid", gap: 20 }}>
          <p id="not-title" style={CAP}>하지 않는 것</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid" }}>
            {NOT.map((t) => <li key={t} style={{ ...DISPLAY, fontSize: "clamp(1.6rem, 2.8vw, 2.6rem)", lineHeight: 1.5, textDecoration: "line-through", textDecorationThickness: "3px", textDecorationColor: INK, color: "#6B665C", borderBottom: HAIR }}>{t}</li>)}
          </ul>
        </div>
        <div style={{ gridColumn: "7 / 13", display: "grid", gap: 40 }}>
          <p style={CAP}>남는 것</p>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ ...NUM, fontSize: "clamp(6rem, 15vw, 15rem)" }}>4</p>
            <p style={{ ...DISPLAY, fontSize: "clamp(1.4rem, 2.4vw, 2.2rem)" }}>개 필드</p>
            <p style={{ margin: "8px 0 0", fontSize: 17, lineHeight: 1.6, maxWidth: 440 }}>URL, 제목, 출처, 저장 시각. 그 외의 데이터는 서버에 만들어지지 않습니다.</p>
          </div>
          <div style={{ display: "grid", gap: 8, borderTop: HAIR, paddingTop: 32 }}>
            <p style={{ ...NUM, fontSize: "clamp(6rem, 15vw, 15rem)" }}>0</p>
            <p style={{ ...DISPLAY, fontSize: "clamp(1.4rem, 2.4vw, 2.2rem)" }}>바이트의 본문</p>
            <p style={{ margin: "8px 0 0", fontSize: 17, lineHeight: 1.6, maxWidth: 440 }}>페이지 본문을 수집하지 않습니다. 확장 프로그램이 보내는 것은 현재 탭의 URL과 제목뿐입니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Product: search + 3 rows, cropped; no header/aside ---------- */
const ROWS = [
  { id: 1, title: "Manifest V3 migration guide", hostname: "developer.chrome.com", url: "https://developer.chrome.com/docs/extensions/develop/migrate", savedAt: "2026년 9월 13일" },
  { id: 2, title: "Cloudflare D1: 서버리스 SQL 데이터베이스 시작하기", hostname: "developers.cloudflare.com", url: "https://developers.cloudflare.com/d1/get-started/", savedAt: "2026년 9월 12일" },
  { id: 3, title: "브라우저 확장 프로그램으로 읽을 페이지를 저장하는 가장 단순한 방법", hostname: "web.dev", url: "https://web.dev/articles/save-for-later", savedAt: "2026년 9월 10일" },
];
function Product() {
  return (
    <section aria-labelledby="product-title" style={{ borderTop: HAIR }}>
      <div style={{ ...wrap, paddingTop: 112, paddingBottom: 120, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 24, alignItems: "start" }}>
        <div style={{ gridColumn: "1 / 5", display: "grid", gap: 20 }}>
          <p id="product-title" style={CAP}>화면</p>
          <h2 style={{ ...DISPLAY, fontSize: "clamp(1.8rem, 3.2vw, 3rem)" }}>목록, 검색, 열기, 삭제.<br />화면도 여기서 끝납니다.</h2>
        </div>
        <div style={{ gridColumn: "5 / 13", pointerEvents: "none", display: "grid", gap: 16, borderTop: "2px solid " + INK, paddingTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={CAP}>저장한 링크</span><span style={{ ...CAP, color: INK }}>3</span></div>
          <TextInput label="저장한 링크 검색" hideLabel icon="search" placeholder="제목이나 출처로 검색" trailing={<IconButton icon="arrow_forward" label="검색" size={36} />} />
          <ul style={{ margin: 0, padding: 0, display: "grid" }}>{ROWS.map((r) => <LinkRow key={r.id} {...r} style={{ borderRadius: 0, border: "none", borderTop: HAIR, padding: "16px 0", background: "transparent", boxShadow: "none" }} />)}</ul>
        </div>
      </div>
    </section>
  );
}

export function LandingScroll({ onLogin }) {
  React.useEffect(() => { let stop; startLenis().then((s) => (stop = s)); return () => stop?.(); }, []);
  return (
    <div style={{ overflowX: "clip", background: "var(--surface-page)", color: INK }}>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ ...wrap, minHeight: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Brand size={22} />
          <a href="#start" style={{ ...CAP, color: INK, textDecoration: "none", borderBottom: "1px solid " + INK, paddingBottom: 2 }}>시작하기</a>
        </div>
      </header>
      <main>
        <Hero onLogin={onLogin} />
        <NotDoing />
        <Product />
        <section id="start" aria-labelledby="close-title" style={{ borderTop: HAIR }}>
          <div style={{ ...wrap, paddingTop: 128, paddingBottom: 160, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 24, alignItems: "end" }}>
            <h2 id="close-title" style={{ ...DISPLAY, gridColumn: "1 / 9", fontSize: "clamp(2.4rem, 6vw, 6.5rem)" }}>읽고 싶은 순간을<br />놓치지 마세요.</h2>
            <div style={{ gridColumn: "9 / 13", display: "grid", gap: 16, justifyItems: "start" }}>
              <Button size="lg" onClick={onLogin} style={ctaDoodle}>Google로 시작하기</Button>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#6B665C" }}>Google 계정으로 로그인합니다. Chrome 확장 프로그램은 배포 후 연결됩니다.</p>
            </div>
          </div>
        </section>
      </main>
      <footer style={{ borderTop: HAIR }}>
        <div style={{ ...wrap, paddingTop: 32, paddingBottom: 40, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <Brand size={18} />
          <nav aria-label="바닥글" style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {[["GitHub", "https://github.com/jidohyun/NOD"], ["개인정보 처리방침", "#"], ["이용약관", "#"]].map(([l, h]) => (
              <a key={l} href={h} style={{ ...CAP, color: INK, textDecoration: "none" }}>{l}</a>
            ))}
          </nav>
          <span style={CAP}>© 2026 NOD</span>
        </div>
      </footer>
    </div>
  );
}
