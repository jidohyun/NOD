/* LandingScroll port: hero pin (220vh) peels 12 clutter pieces off a saved link until 4 fields remain.
   Rules from DESIGN.md §10: one signature motion, hairlines only, yellow budget x3, doodle border x2. */
(() => {
  "use strict";

  const INK = "#1A1A1A";
  const HAIR = "1px solid rgba(26,26,26,0.14)";
  const CAP = { fontFamily: "var(--landing-body)", fontSize: "0.7rem", letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, color: "#6B665C", fontVariantNumeric: "tabular-nums", margin: 0 };
  const DISPLAY = { fontFamily: "var(--landing-display)", fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.01em", margin: 0, wordBreak: "keep-all", color: INK };
  const NUM = { fontFamily: "var(--landing-display)", fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", lineHeight: 0.9, margin: 0 };
  const wrap = { width: "100%", maxWidth: 1280, margin: "0 auto", paddingLeft: "var(--gutter-desktop)", paddingRight: "var(--gutter-desktop)" };

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (v, [i0, i1], [o0, o1]) => lerp(o0, o1, clamp01((v - i0) / (i1 - i0)));
  const REDUCED = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function el(tag, style, children = []) {
    const node = document.createElement(tag);
    if (style) Object.assign(node.style, style);
    for (const child of children) node.append(child);
    return node;
  }
  const txt = (s) => document.createTextNode(s);

  function createProgress(element, mode = "pin") {
    const subs = new Set();
    let value = -1, raf = 0, visible = true;
    const compute = () => {
      const r = element.getBoundingClientRect();
      const vh = window.innerHeight;
      return mode === "pin" ? clamp01(-r.top / Math.max(1, element.offsetHeight - vh)) : clamp01((vh - r.top) / (vh + element.offsetHeight));
    };
    const tick = () => { raf = 0; const v = compute(); if (v !== value) { value = v; subs.forEach((f) => f(v)); } };
    const onScroll = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) onScroll(); }, { rootMargin: "50% 0px 50% 0px" });
    io.observe(element);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    tick();
    return {
      on: (f) => { subs.add(f); f(value); return () => subs.delete(f); },
      destroy: () => { io.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); },
    };
  }

  async function startLenis() {
    if (REDUCED) return () => {};
    try {
      const { default: Lenis } = await import("/vendor/lenis.mjs");
      const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, smoothTouch: false });
      let id;
      const raf = (t) => { lenis.raf(t); id = requestAnimationFrame(raf); };
      id = requestAnimationFrame(raf);
      return () => { cancelAnimationFrame(id); lenis.destroy(); };
    } catch (e) { console.warn("lenis unavailable", e); return () => {}; }
  }

  const chip = (t, extra) => el("span", { display: "inline-block", padding: "3px 10px", border: HAIR, borderRadius: 999, fontSize: "12px", color: "#6B665C", background: "var(--surface-card)", ...extra }, [txt(t)]);
  const TAGS = ["chrome", "extension", "mv3", "migration", "javascript", "web", "later"];

  function clutterNodes() {
    const cap = (t) => el("span", CAP, [txt(t)]);
    return [
      { key: "ai", tier: "heavy", node: el("div", { display: "grid", gap: "6px", padding: "12px", border: HAIR, borderRadius: "6px", fontSize: "13px", lineHeight: 1.5, color: "#6B665C", background: "var(--surface-card)" }, [cap("AI 요약"), el("span", null, [txt("Manifest V3는 백그라운드 페이지를 서비스 워커로 대체하며, 원격 코드 실행을 금지합니다.")]), el("span", null, [txt("확장 프로그램은 declarativeNetRequest로 요청을 처리해야 하며…")]), el("span", null, [txt("마이그레이션 기한은 2024년 6월로 예정되어…")])]) },
      { key: "rec", tier: "heavy", node: el("div", { display: "grid", gap: "6px", fontSize: "13px", color: "#6B665C" }, [cap("추천 아티클"), el("span", null, [txt("Service workers in extensions")]), el("span", null, [txt("Migrating from background pages")]), el("span", null, [txt("Chrome extension security model")])]) },
      { key: "notes", tier: "heavy", node: el("div", { fontSize: "13px", color: "#6B665C", borderLeft: "2px solid rgba(26,26,26,0.14)", paddingLeft: "10px" }, [txt("메모: 나중에 팀에 공유할 것")]) },
      { key: "hl", tier: "heavy", node: el("div", { display: "grid", gap: "6px", fontSize: "14px", lineHeight: 1.5 }, [el("span", { background: "rgba(26,26,26,0.08)", padding: "2px 4px" }, [txt("“서비스 워커는 필요할 때만 실행된다”")]), el("span", { background: "rgba(26,26,26,0.08)", padding: "2px 4px" }, [txt("“원격 호스팅 코드는 더 이상 허용되지 않는다”")])]) },
      { key: "tags", tier: "light", node: el("div", { display: "flex", flexWrap: "wrap", gap: "6px" }, TAGS.map((t, i) => { const s = el("span", { display: "inline-block", willChange: "transform, opacity" }, [chip("#" + t)]); s.dataset.chip = i; return s; })) },
      { key: "stars", tier: "light", node: el("div", { fontSize: "14px", letterSpacing: "2px", color: "#6B665C" }, [txt("★★★★☆")]) },
      { key: "share", tier: "light", node: el("div", { display: "flex", gap: "6px" }, ["공유", "메일", "Slack", "복사"].map((t, i) => { const s = el("span", { display: "inline-block", willChange: "transform, opacity" }, [chip(t)]); s.dataset.chip = i; return s; })) },
      { key: "author", tier: "light", node: el("div", { fontSize: "13px", color: "#6B665C" }, [txt("작성자 · Chrome Developers · 12,304명 저장")]) },
      { key: "unread", tier: "status", node: el("div", null, [chip("읽지 않음 47", { fontWeight: 700 })]) },
      { key: "prog", tier: "status", node: el("div", { display: "grid", gap: "4px", fontSize: "12px", color: "#6B665C" }, [el("span", null, [txt("읽음 34%")]), el("span", { height: "4px", background: "rgba(26,26,26,0.1)" }, [el("span", { display: "block", width: "34%", height: "100%", background: "#6B665C" })])]) },
      { key: "time", tier: "status", node: el("div", { fontSize: "13px", color: "#6B665C" }, [txt("읽는 데 12분")]) },
      { key: "folder", tier: "status", node: el("div", { fontSize: "13px", color: "#6B665C" }, [txt("Inbox / Tech / Later")]) },
    ];
  }

  const WINDOWS = (() => {
    const w = {};
    const heavy = ["ai", "rec", "notes", "hl"], light = ["tags", "stars", "share", "author"], status = ["unread", "prog", "time", "folder"];
    heavy.forEach((k, i) => { const s0 = (0.35 - 0.12) * (i / (heavy.length - 1)); w[k] = [s0, s0 + 0.12]; });
    light.forEach((k, i) => { const s0 = 0.35 + (0.27 - 0.07) * (i / (light.length - 1)); w[k] = [s0, s0 + 0.07]; });
    status.forEach((k, i) => { const s0 = 0.62 + (0.18 - 0.06) * (i / (status.length - 1)); w[k] = [s0, s0 + 0.06]; });
    return w;
  })();

  const DOODLE_PATH = "M 8 6 C 200 2, 420 10, 632 6 C 640 90, 636 200, 632 300 C 420 306, 200 298, 8 302 C 4 200, 6 90, 8 6 Z";

  function ctaButton(doodle) {
    const a = el("a", {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
      minHeight: "52px", padding: "0 28px", fontSize: "18px", fontFamily: "var(--landing-body)", fontWeight: 700,
      lineHeight: 1.2, textDecoration: "none", cursor: "pointer", whiteSpace: "nowrap",
      background: "var(--color-brand)", color: INK,
      border: doodle ? "3px solid " + INK : "2px solid " + INK,
      borderRadius: doodle ? "var(--radius-doodle)" : "8px",
      boxShadow: doodle ? "var(--shadow-sketch)" : "none",
      transition: "background var(--duration-hover) var(--ease-out), color var(--duration-hover) var(--ease-out), box-shadow var(--duration-hover) var(--ease-out), transform var(--duration-fast) var(--ease-out)",
    }, [txt("Google로 시작하기")]);
    a.href = "/auth/google";
    a.addEventListener("mouseenter", () => { a.style.background = INK; a.style.color = "#fff"; a.style.boxShadow = "var(--shadow-sketch-hover)"; });
    a.addEventListener("mouseleave", () => { a.style.background = "var(--color-brand)"; a.style.color = INK; a.style.boxShadow = doodle ? "var(--shadow-sketch)" : "none"; });
    a.addEventListener("mousedown", () => { a.style.transform = "translate(2px,2px)"; a.style.boxShadow = "none"; });
    a.addEventListener("mouseup", () => { a.style.transform = ""; a.style.boxShadow = "var(--shadow-sketch-hover)"; });
    return a;
  }

  function brand(size) {
    const img = el("img", { height: `${size * 1.15}px`, width: "auto", display: "block" });
    img.src = "/assets/nod-logo.png";
    img.alt = "NOD";
    const a = el("a", { display: "inline-flex", alignItems: "center", textDecoration: "none" }, [img]);
    a.href = "/";
    a.setAttribute("aria-label", "NOD 홈");
    return a;
  }

  function hero() {
    const pieces = {};
    const measure = { baseH: 0, h: {} };
    const smooth = { fit: 1, target: 1, raf: 0, v: 0 };
    const capText = { current: "other" };

    const capLabel = el("span", null, [txt("다른 앱이 링크 하나에 붙이는 것")]);
    const capNum = el("span", { ...CAP, color: INK, fontSize: "1rem", letterSpacing: "0.1em" }, [txt("12")]);
    const saved = el("span", { ...CAP, color: INK, position: "absolute", top: "26px", right: "28px", opacity: 0 }, [txt("저장됨")]);
    const title = el("p", { ...CAP, marginTop: "8px", opacity: 0, color: INK, textAlign: "center" }, [txt("URL · 제목 · 출처 · 저장 시각 — 이 넷이 전부입니다")]);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 640 308");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    Object.assign(svg.style, { position: "absolute", inset: "-4px", width: "calc(100% + 8px)", height: "calc(100% + 8px)", opacity: 0, pointerEvents: "none", overflow: "visible" });
    const stroke = document.createElementNS(svgNS, "path");
    stroke.setAttribute("d", DOODLE_PATH);
    stroke.setAttribute("fill", "none");
    stroke.setAttribute("stroke", "var(--color-brand)");
    stroke.setAttribute("stroke-width", "3");
    stroke.setAttribute("stroke-linecap", "round");
    stroke.setAttribute("stroke-linejoin", "round");
    stroke.setAttribute("vector-effect", "non-scaling-stroke");
    svg.append(stroke);

    const card = el("div", { background: "var(--surface-card)", border: HAIR, borderRadius: "8px", padding: "24px 28px", position: "relative", willChange: "transform" }, [
      svg,
      saved,
      el("div", { display: "grid", gap: "6px", marginBottom: "20px" }, [
        el("span", { fontSize: "13px", color: "#6B665C", fontVariantNumeric: "tabular-nums" }, [txt("https://developer.chrome.com/docs/extensions/develop/migrate")]),
        el("span", { ...DISPLAY, fontSize: "24px", lineHeight: 1.3 }, [txt("Manifest V3 migration guide")]),
        el("span", { fontSize: "14px", color: "#6B665C" }, [txt("developer.chrome.com")]),
        el("span", { fontSize: "14px", color: "#6B665C", fontVariantNumeric: "tabular-nums" }, [txt("2026년 9월 13일")]),
      ]),
    ]);
    const clutterWrap = el("div");
    for (const c of clutterNodes()) {
      const holder = el("div", { overflow: "visible", marginBottom: "16px", willChange: "transform, opacity" }, [c.node]);
      pieces[c.key] = { el: holder, tier: c.tier };
      clutterWrap.append(holder);
    }
    card.append(clutterWrap);

    const paintCard = () => {
      const { v, fit } = smooth;
      const scaleSnap = 1 - 0.03 * (1 - easeOut(map(v, [0.78, 0.82], [0, 1]))) * map(v, [0.77, 0.78], [0, 1]);
      const rot = -1.25 * easeOut(map(v, [0.82, 0.92], [0, 1]));
      card.style.transform = REDUCED ? "none" : `scale(${fit * scaleSnap}) rotate(${rot}deg)`;
      card.style.transformOrigin = "top center";
    };
    const tick = () => {
      smooth.fit += (smooth.target - smooth.fit) * 0.18;
      paintCard();
      if (Math.abs(smooth.target - smooth.fit) > 0.0005) smooth.raf = requestAnimationFrame(tick);
      else { smooth.fit = smooth.target; paintCard(); smooth.raf = 0; }
    };

    const apply = (v) => {
      let remaining = 12;
      let targetH = measure.baseH;
      let idx = 0;
      for (const key of Object.keys(pieces)) {
        const { el: piece, tier } = pieces[key];
        const [s0, s1] = WINDOWS[key];
        const t = map(v, [s0, s1], [0, 1]);
        if (t >= 0.5) remaining -= 1;
        const h = measure.h[key] || 0;
        const collapse = easeInOut(map(t, [0.55, 1], [0, 1]));
        targetH += (h + 16) * (1 - collapse);
        piece.style.pointerEvents = "none";
        piece.style.maxHeight = h * (1 - collapse) + "px";
        piece.style.marginBottom = 16 * (1 - collapse) + "px";
        const dir = idx % 2 ? 1 : -1;
        idx += 1;
        if (REDUCED) { piece.style.opacity = String(1 - t); piece.style.transform = "none"; continue; }
        if (tier === "heavy") {
          const e = easeIn(t);
          piece.style.opacity = String(1 - map(t, [0.25, 0.85], [0, 1]));
          piece.style.transform = `translate3d(${dir * 18 * e}px, ${110 * e}px, 0) rotate(${dir * 5 * e}deg)`;
        } else if (tier === "light") {
          const chips = piece.querySelectorAll("[data-chip]");
          if (chips.length) {
            piece.style.opacity = "1";
            piece.style.transform = "none";
            chips.forEach((ch, i) => {
              const ct = map(t, [(i / chips.length) * 0.6, (i / chips.length) * 0.6 + 0.4], [0, 1]);
              const e = easeOut(ct);
              const d = i % 2 ? 1 : -1;
              ch.style.opacity = String(1 - ct);
              ch.style.transform = `translate3d(${d * (40 + i * 10) * e}px, ${-(30 + i * 6) * e}px, 0) rotate(${d * 12 * e}deg)`;
            });
          } else {
            const e = easeOut(t);
            piece.style.opacity = String(1 - t);
            piece.style.transform = `translate3d(${dir * 60 * e}px, ${-24 * e}px, 0)`;
          }
        } else {
          piece.style.opacity = String(1 - t);
          piece.style.transform = `scale(${1 - 0.1 * t})`;
          piece.style.transformOrigin = "left center";
        }
      }
      const want = v >= 0.81 ? "nod" : "other";
      if (want !== capText.current) {
        capText.current = want;
        capLabel.textContent = want === "nod" ? "NOD가 저장하는 것" : "다른 앱이 링크 하나에 붙이는 것";
      }
      capLabel.style.opacity = String(1 - map(v, [0.78, 0.81], [0, 1]) + map(v, [0.81, 0.84], [0, 1]));
      capNum.textContent = String(want === "nod" ? 4 : remaining).padStart(2, "0");
      const hairA = map(v, [0.8, 0.86], [0.14, 0]);
      card.style.border = `1px solid rgba(26,26,26,${hairA.toFixed(3)})`;
      svg.style.opacity = String(map(v, [0.82, 0.86], [0, 1]));
      const drawn = easeOut(map(v, [0.82, 0.92], [0, 1]));
      const len = stroke.getTotalLength ? stroke.getTotalLength() : 2000;
      stroke.style.strokeDasharray = String(len);
      stroke.style.strokeDashoffset = String(len * (1 - drawn));
      const lit = map(v, [0.92, 1], [0, 1]);
      saved.style.opacity = String(lit);
      title.style.opacity = String(lit);
      smooth.v = v;
      if (card.parentElement) {
        const avail = window.innerHeight - card.parentElement.getBoundingClientRect().top - 24;
        smooth.target = Math.max(0.8, Math.min(1, avail / Math.max(1, targetH)));
      }
      paintCard();
      if (!smooth.raf) smooth.raf = requestAnimationFrame(tick);
    };

    const section = el("section", { position: "relative", height: "220vh" }, [
      el("div", { position: "sticky", top: 0, height: "100dvh", overflow: "hidden", display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", alignItems: "start" }, [
        el("div", { ...wrap, paddingTop: "13vh", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "24px", alignItems: "end" }, [
          el("div", null, [
            el("p", CAP, [txt("NOD — 개인 링크 라이브러리")]),
            el("h1", { ...DISPLAY, fontSize: "clamp(1.8rem, 4.2vw, 4rem)", marginTop: "14px", overflowWrap: "anywhere" }, [txt("요약은 필요 없습니다."), el("br"), txt("자리만 있으면 됩니다.")]),
          ]),
          ctaButton(false),
        ]),
        el("div", { ...wrap, alignSelf: "start", display: "grid", justifyItems: "center", paddingTop: "28px", minHeight: 0 }, [
          el("div", { width: "min(640px, 100%)", display: "grid", gap: "12px" }, [
            el("p", { ...CAP, display: "flex", justifyContent: "space-between", alignItems: "baseline" }, [capLabel, capNum]),
            card,
            title,
          ]),
        ]),
      ]),
    ]);
    section.setAttribute("aria-labelledby", "hero-title");
    section.querySelector("h1").id = "hero-title";

    requestAnimationFrame(() => {
      const h = {};
      let sum = 0;
      for (const [k, p] of Object.entries(pieces)) { h[k] = p.el.scrollHeight; sum += p.el.scrollHeight + 16; }
      measure.h = h;
      measure.baseH = card.scrollHeight - sum;
      smooth.fit = 1;
    });
    const progress = createProgress(section, "pin");
    const off = progress.on(apply);
    return { node: section, destroy: () => { off(); progress.destroy(); cancelAnimationFrame(smooth.raf); } };
  }

  function notDoing() {
    const NOT = ["요약", "태그", "폴더", "추천", "읽음 상태", "하이라이트", "읽는 시간"];
    const num = (n, label, desc) => el("div", { display: "grid", gap: "8px" }, [
      el("p", { ...NUM, fontSize: "clamp(6rem, 15vw, 15rem)" }, [txt(n)]),
      el("p", { ...DISPLAY, fontSize: "clamp(1.4rem, 2.4vw, 2.2rem)" }, [txt(label)]),
      el("p", { margin: "8px 0 0", fontSize: "17px", lineHeight: 1.6, maxWidth: "440px" }, [txt(desc)]),
    ]);
    const section = el("section", { borderTop: HAIR }, [
      el("div", { ...wrap, paddingTop: "112px", paddingBottom: "112px", display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "24px", alignItems: "start" }, [
        el("div", { gridColumn: "1 / 6", display: "grid", gap: "20px" }, [
          el("p", CAP, [txt("하지 않는 것")]),
          el("ul", { margin: 0, padding: 0, listStyle: "none", display: "grid" }, NOT.map((t) =>
            el("li", { ...DISPLAY, fontSize: "clamp(1.6rem, 2.8vw, 2.6rem)", lineHeight: 1.5, textDecoration: "line-through", textDecorationThickness: "3px", textDecorationColor: INK, color: "#6B665C", borderBottom: HAIR }, [txt(t)]))),
        ]),
        el("div", { gridColumn: "7 / 13", display: "grid", gap: "40px" }, [
          el("p", CAP, [txt("남는 것")]),
          num("4", "개 필드", "URL, 제목, 출처, 저장 시각. 그 외의 데이터는 서버에 만들어지지 않습니다."),
          el("div", { display: "grid", gap: "8px", borderTop: HAIR, paddingTop: "32px" }, [
            el("p", { ...NUM, fontSize: "clamp(6rem, 15vw, 15rem)" }, [txt("0")]),
            el("p", { ...DISPLAY, fontSize: "clamp(1.4rem, 2.4vw, 2.2rem)" }, [txt("바이트의 본문")]),
            el("p", { margin: "8px 0 0", fontSize: "17px", lineHeight: 1.6, maxWidth: "440px" }, [txt("페이지 본문을 수집하지 않습니다. 확장 프로그램이 보내는 것은 현재 탭의 URL과 제목뿐입니다.")]),
          ]),
        ]),
      ]),
    ]);
    section.setAttribute("aria-labelledby", "not-title");
    section.querySelector("p").id = "not-title";
    return section;
  }

  function product() {
    const ROWS = [
      { title: "Manifest V3 migration guide", hostname: "developer.chrome.com", url: "https://developer.chrome.com/docs/extensions/develop/migrate", savedAt: "2026년 9월 13일" },
      { title: "Cloudflare D1: 서버리스 SQL 데이터베이스 시작하기", hostname: "developers.cloudflare.com", url: "https://developers.cloudflare.com/d1/get-started/", savedAt: "2026년 9월 12일" },
      { title: "브라우저 확장 프로그램으로 읽을 페이지를 저장하는 가장 단순한 방법", hostname: "web.dev", url: "https://web.dev/articles/save-for-later", savedAt: "2026년 9월 10일" },
    ];
    const icon = (name, size = 20, color = "var(--text-secondary)") => {
      const s = el("span", { fontSize: `${size}px`, color });
      s.className = "material-symbols-outlined";
      s.textContent = name;
      s.setAttribute("aria-hidden", "true");
      return s;
    };
    const searchBox = el("div", { position: "relative", display: "flex", alignItems: "center", gap: "8px", minHeight: "48px", padding: "0 12px", background: "var(--surface-card)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-control)" }, [
      icon("search"),
      el("input", { flex: 1, minWidth: 0, border: 0, outline: 0, background: "transparent", fontSize: "16px", padding: "10px 0", color: "var(--text-primary)", fontFamily: "var(--landing-body)" }),
      icon("arrow_forward", 20, "var(--text-primary)"),
    ]);
    searchBox.querySelector("input").placeholder = "제목이나 출처로 검색";
    const row = (r) => el("li", { listStyle: "none", display: "grid", gap: "6px", padding: "16px 0", borderTop: HAIR }, [
      el("span", { fontSize: "var(--text-link-title)", lineHeight: "var(--leading-link)", fontWeight: 700, color: "var(--text-primary)" }, [txt(r.title)]),
      el("p", { margin: 0, display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: "var(--text-meta)", lineHeight: "var(--leading-meta)", color: "var(--text-secondary)" }, [
        el("span", { fontWeight: 700 }, [txt(r.hostname)]),
        el("span", null, [txt(r.savedAt)]),
      ]),
      el("span", { fontSize: "var(--text-meta-sm)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, [txt(r.url)]),
    ]);
    const section = el("section", { borderTop: HAIR }, [
      el("div", { ...wrap, paddingTop: "112px", paddingBottom: "120px", display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "24px", alignItems: "start" }, [
        el("div", { gridColumn: "1 / 5", display: "grid", gap: "20px" }, [
          el("p", CAP, [txt("화면")]),
          el("h2", { ...DISPLAY, fontSize: "clamp(1.8rem, 3.2vw, 3rem)" }, [txt("목록, 검색, 열기, 삭제."), el("br"), txt("화면도 여기서 끝납니다.")]),
        ]),
        el("div", { gridColumn: "5 / 13", pointerEvents: "none", display: "grid", gap: "16px", borderTop: "2px solid " + INK, paddingTop: "20px" }, [
          el("div", { display: "flex", justifyContent: "space-between", alignItems: "baseline" }, [el("span", CAP, [txt("저장한 링크")]), el("span", { ...CAP, color: INK }, [txt("3")])]),
          searchBox,
          el("ul", { margin: 0, padding: 0, display: "grid" }, ROWS.map(row)),
        ]),
      ]),
    ]);
    section.setAttribute("aria-labelledby", "product-title");
    section.querySelector("p").id = "product-title";
    return section;
  }

  function closing() {
    const section = el("section", { borderTop: HAIR }, [
      el("div", { ...wrap, paddingTop: "128px", paddingBottom: "160px", display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "24px", alignItems: "end" }, [
        el("h2", { ...DISPLAY, gridColumn: "1 / 9", fontSize: "clamp(2.4rem, 6vw, 6.5rem)" }, [txt("읽고 싶은 순간을"), el("br"), txt("놓치지 마세요.")]),
        el("div", { gridColumn: "9 / 13", display: "grid", gap: "16px", justifyItems: "start" }, [
          ctaButton(true),
          el("p", { margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#6B665C" }, [txt("Google 계정으로 로그인합니다. Chrome 확장 프로그램은 배포 후 연결됩니다.")]),
        ]),
      ]),
    ]);
    section.id = "start";
    section.setAttribute("aria-labelledby", "close-title");
    section.querySelector("h2").id = "close-title";
    return section;
  }

  function mount(app, message = "") {
    const heroPart = hero();
    const root = el("div", { overflowX: "clip", background: "var(--surface-page)", color: INK }, [
      el("header", { position: "fixed", top: 0, left: 0, right: 0, zIndex: 10 }, [
        el("div", { ...wrap, minHeight: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }, [
          brand(22),
          (() => { const a = el("a", { ...CAP, color: INK, textDecoration: "none", borderBottom: "1px solid " + INK, paddingBottom: "2px" }, [txt("시작하기")]); a.href = "#start"; return a; })(),
        ]),
      ]),
      el("main", null, [heroPart.node, notDoing(), product(), closing()]),
      el("footer", { borderTop: HAIR }, [
        el("div", { ...wrap, paddingTop: "32px", paddingBottom: "40px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }, [
          brand(18),
          el("nav", { display: "flex", flexWrap: "wrap", gap: "24px" }, [
            (() => { const a = el("a", { ...CAP, color: INK, textDecoration: "none" }, [txt("GitHub")]); a.href = "https://github.com/jidohyun/NOD"; return a; })(),
            el("a", { ...CAP, color: INK, textDecoration: "none" }, [txt("개인정보 처리방침")]),
            el("a", { ...CAP, color: INK, textDecoration: "none" }, [txt("이용약관")]),
          ]),
          el("span", CAP, [txt("© 2026 NOD")]),
        ]),
      ]),
    ]);
    root.querySelector("nav").setAttribute("aria-label", "바닥글");
    app.replaceChildren(root);
    if (message) {
      const note = el("p", { ...CAP, position: "fixed", bottom: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 10, color: INK }, [txt(message)]);
      root.append(note);
    }
    let stopLenis = () => {};
    startLenis().then((s) => { stopLenis = s; });
    return () => { heroPart.destroy(); stopLenis(); };
  }

  let unmount = null;
  window.NodLanding = {
    mount(app, message) {
      this.unmount();
      unmount = mount(app, message);
    },
    unmount() {
      if (unmount) { unmount(); unmount = null; }
    },
  };
})();
