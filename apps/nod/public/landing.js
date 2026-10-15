/* NOD landing behaviour (landing-interaction-standard.md §0): one frame loop (motion) drives Lenis and every scene;
   each scene derives one progress value from geometry cached on resize, and per frame writes transform/opacity only. */
(() => {
  "use strict";

  const DEPTHS = [10, 14, 12, 16, 13, 17, 11, 15];
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const map = (v, a, b, from = 0, to = 1) => from + (to - from) * clamp01((v - a) / (b - a));
  const easeIn = (t) => t * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  function splitWords(heading) {
    const label = [...heading.childNodes].map((n) => (n.nodeName === "BR" ? " " : n.textContent)).join("").replace(/\s+/g, " ").trim();
    heading.setAttribute("aria-label", label);
    const words = [];
    for (const node of [...heading.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const frag = document.createDocumentFragment();
      for (const part of node.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.append(" "); continue; }
        const span = document.createElement("span");
        span.className = "ld-word";
        span.setAttribute("aria-hidden", "true");
        span.textContent = part;
        frag.append(span);
        words.push(span);
      }
      node.replaceWith(frag);
    }
    return words;
  }

  function heroScene(el, reduced) {
    const words = splitWords(el.querySelector("[data-words]"));
    const stage = el.querySelector("[data-stage]");
    const sticky = el.querySelector(".ld-hero__sticky");
    const card = el.querySelector("[data-card]");
    const hair = el.querySelector("[data-hair]");
    const doodle = el.querySelector("[data-doodle]");
    const path = doodle.querySelector("path");
    const saved = el.querySelector("[data-saved]");
    const final = el.querySelector("[data-final]");
    const label = el.querySelector("[data-label]");
    const count = el.querySelector("[data-count]");
    const tiers = { heavy: [0, 0.35, 0.12], light: [0.35, 0.62, 0.07], status: [0.62, 0.8, 0.06] };
    const pieces = [...el.querySelectorAll("[data-piece]")].map((node, i) => ({ node, tier: node.dataset.piece, dir: i % 2 ? 1 : -1, chips: [...node.querySelectorAll("[data-chip]")] }));
    for (const tier of Object.keys(tiers)) {
      const group = pieces.filter((p) => p.tier === tier);
      const [start, end, span] = tiers[tier];
      group.forEach((p, i) => { const s0 = start + (end - start - span) * (i / Math.max(1, group.length - 1)); p.window = [s0, s0 + span]; });
    }
    const g = { top: 0, height: 1, vh: 1, len: 0 };
    let shownLabel = "";
    let shownCount = "";

    return {
      measure(vh) {
        stage.style.setProperty("--fit", "1");
        const avail = vh - (stage.getBoundingClientRect().top - sticky.getBoundingClientRect().top) - 24;
        const fit = Math.max(0.62, Math.min(1, avail / stage.offsetHeight));
        stage.style.setProperty("--fit", fit.toFixed(3));
        g.top = docTop(el);
        g.height = el.offsetHeight;
        g.vh = vh;
        g.len = path.getTotalLength();
        path.style.strokeDasharray = String(g.len);
      },
      render(y) {
        if (y < g.top - g.vh || y > g.top + g.height) return;
        const p = clamp01((y - g.top) / (g.height - g.vh));
        const exit = clamp01((y - (g.top + g.height - g.vh)) / g.vh);
        if (!reduced) words.forEach((w, i) => { w.style.transform = `translate3d(0, ${(-exit * DEPTHS[i % 8]).toFixed(2)}vh, 0)`; });

        let remaining = pieces.length;
        for (const piece of pieces) {
          const t = map(p, piece.window[0], piece.window[1]);
          if (t >= 0.5) remaining -= 1;
          const s = piece.node.style;
          if (reduced) { s.opacity = String(1 - t); continue; }
          if (piece.tier === "heavy") {
            const e = easeIn(t);
            s.opacity = String(1 - map(t, 0.25, 0.85));
            s.transform = `translate3d(${piece.dir * 24 * e}px, ${170 * e}px, 0) rotate(${piece.dir * 8 * e}deg)`;
          } else if (piece.tier === "light" && piece.chips.length) {
            piece.chips.forEach((chip, i) => {
              const k = i / piece.chips.length;
              const ct = map(t, k * 0.6, k * 0.6 + 0.4);
              const e = easeOut(ct);
              const d = i % 2 ? 1 : -1;
              chip.style.opacity = String(1 - ct);
              chip.style.transform = `translate3d(${d * (40 + i * 10) * e}px, ${-(30 + i * 6) * e}px, 0) rotate(${d * 12 * e}deg)`;
            });
          } else if (piece.tier === "light") {
            const e = easeOut(t);
            s.opacity = String(1 - t);
            s.transform = `translate3d(${piece.dir * 60 * e}px, ${-24 * e}px, 0)`;
          } else {
            s.opacity = String(1 - t);
            s.transform = `scale(${1 - 0.1 * t})`;
          }
        }

        const settled = p >= 0.81;
        const nextLabel = settled ? "NOD가 저장하는 것" : "다른 앱이 링크 하나에 붙이는 것";
        const nextCount = String(settled ? 4 : remaining).padStart(2, "0");
        if (nextLabel !== shownLabel) { label.textContent = nextLabel; shownLabel = nextLabel; }
        if (nextCount !== shownCount) { count.textContent = nextCount; shownCount = nextCount; }
        label.style.opacity = String(1 - map(p, 0.78, 0.81) + map(p, 0.81, 0.84));

        if (!reduced) {
          const snap = 1 - 0.03 * (1 - easeOut(map(p, 0.78, 0.82))) * map(p, 0.77, 0.78);
          const rot = -1.25 * easeOut(map(p, 0.82, 0.92));
          card.style.transform = `scale(${snap.toFixed(4)}) rotate(${rot.toFixed(3)}deg)`;
        }
        hair.style.opacity = String(map(p, 0.8, 0.86, 1, 0));
        doodle.style.opacity = String(map(p, 0.82, 0.86));
        path.style.strokeDashoffset = String(g.len * (1 - easeOut(map(p, 0.82, 0.92))));
        const lit = String(map(p, 0.92, 1));
        saved.style.opacity = lit;
        final.style.opacity = lit;
      },
    };
  }

  function notScene(el, reduced) {
    const strikes = [...el.querySelectorAll("[data-strike] .ld-strike")];
    const rises = [...el.querySelectorAll("[data-rise]")].map((node) => ({ node, center: 0 }));
    const g = { top: 0, height: 1, vh: 1 };
    return {
      measure(vh) {
        g.top = docTop(el);
        g.height = el.offsetHeight;
        g.vh = vh;
        for (const r of rises) r.center = docTop(r.node) + r.node.offsetHeight / 2;
      },
      render(y) {
        if (y < g.top - g.vh || y > g.top + g.height) return;
        const v = clamp01((y + g.vh - g.top) / (g.height + g.vh));
        strikes.forEach((s, i) => { s.style.transform = `scaleX(${reduced ? 1 : map(v, 0.1 + i * 0.04, 0.22 + i * 0.04).toFixed(4)})`; });
        for (const r of rises) {
          const d = r.center - (y + g.vh / 2);
          const q = clamp01(1 - d / (g.vh * 0.55));
          r.node.style.opacity = String(map(q, 0, 0.6));
          if (!reduced) r.node.style.transform = `translate3d(0, ${((1 - easeOut(q)) * 48).toFixed(2)}px, 0)`;
        }
      },
    };
  }

  /* Outer height = viewport + horizontal overflow, re-measured on resize and after fonts load (standard §3.3). */
  function timelineScene(el, reduced) {
    const track = el.querySelector("[data-track]");
    const rail = el.querySelector("[data-rail]");
    const slots = [...el.querySelectorAll("[data-slot]")].map((node) => ({ node, center: 0, link: node.querySelector("[data-link]") }));
    const g = { top: 0, height: 1, vh: 1, vw: 1, overflow: 0, radius: 800 };
    return {
      measure(vh, vw) {
        if (reduced) { el.style.height = ""; g.top = 0; g.height = 0; return; }
        g.vh = vh;
        g.vw = vw;
        g.overflow = Math.max(0, track.scrollWidth - vw);
        const height = `${Math.round(vh + g.overflow)}px`;
        if (el.style.height !== height) el.style.height = height;
        g.radius = Math.min(800, vw * 0.9);
        for (const s of slots) s.center = s.node.offsetLeft + s.node.offsetWidth / 2;
      },
      measureTop() { if (!reduced) { g.top = docTop(el); g.height = el.offsetHeight; } },
      render(y) {
        if (reduced || y < g.top - g.vh || y > g.top + g.height) return;
        const p = clamp01((y - g.top) / (g.height - g.vh));
        const x = -p * g.overflow;
        track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
        rail.style.transform = `scaleX(${p.toFixed(4)})`;
        const mid = g.vw / 2;
        for (const s of slots) {
          const v = clamp01(1 - (s.center + x - mid) / g.radius);
          const line = v < 0.5 ? v / 0.5 : 1;
          const placed = v < 0.5 ? 0 : (v - 0.5) / 0.5;
          s.node.style.opacity = String(line);
          s.link.style.opacity = String(placed);
          s.link.style.transform = `translate3d(0, ${(-(1 - easeOut(placed)) * 28).toFixed(2)}px, 0)`;
        }
      },
    };
  }

  function closingScene(el, reduced) {
    const words = splitWords(el.querySelector("[data-words]"));
    const g = { top: 0, height: 1, vh: 1 };
    return {
      measure(vh) { g.top = docTop(el); g.height = el.offsetHeight; g.vh = vh; },
      render(y) {
        if (reduced || y < g.top - g.vh || y > g.top + g.height) return;
        const v = clamp01((y + g.vh - g.top) / (g.height + g.vh));
        words.forEach((w, i) => { w.style.transform = `translate3d(0, ${((0.5 - v) * DEPTHS[i % 8] * 0.6).toFixed(2)}vh, 0)`; });
      },
    };
  }

  function createLanding(app, root) {
    const reduced = reducedQuery.matches;
    const scenes = {
      hero: heroScene(root.querySelector('[data-scene="hero"]'), reduced),
      not: notScene(root.querySelector('[data-scene="not"]'), reduced),
      timeline: timelineScene(root.querySelector('[data-scene="timeline"]'), reduced),
      closing: closingScene(root.querySelector('[data-scene="closing"]'), reduced),
    };
    const list = Object.values(scenes);
    const message = root.querySelector("[data-message]");
    let lastY = -1;
    let dirty = true;
    let disposed = false;
    let lenis = null;
    let stopLoop = () => {};
    let measureQueued = false;

    const measure = () => {
      measureQueued = false;
      if (disposed) return;
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth;
      scenes.timeline.measure(vh, vw);
      scenes.hero.measure(vh);
      scenes.not.measure(vh);
      scenes.timeline.measureTop();
      scenes.closing.measure(vh);
      if (lenis) lenis.resize();
      dirty = true;
    };
    const queueMeasure = () => { if (!measureQueued) { measureQueued = true; requestAnimationFrame(measure); } };
    const update = (timestamp) => { if (lenis) lenis.raf(timestamp); };
    const render = () => {
      const y = window.scrollY;
      if (y === lastY && !dirty) return;
      lastY = y;
      dirty = false;
      for (const scene of list) scene.render(y);
    };

    measure();
    render();
    window.addEventListener("resize", queueMeasure);
    const resizeObserver = new ResizeObserver(queueMeasure);
    resizeObserver.observe(root);
    document.fonts.ready.then(queueMeasure);

    import("/vendor/motion-frame.mjs").then(({ frame, cancelFrame }) => {
      if (disposed) return;
      const onUpdate = ({ timestamp }) => update(timestamp);
      frame.update(onUpdate, true);
      frame.render(render, true);
      stopLoop = () => { cancelFrame(onUpdate); cancelFrame(render); };
    }).catch((error) => {
      console.warn("motion frame loop unavailable; using requestAnimationFrame", error);
      if (disposed) return;
      let id = 0;
      const tick = (t) => { update(t); render(); id = requestAnimationFrame(tick); };
      id = requestAnimationFrame(tick);
      stopLoop = () => cancelAnimationFrame(id);
    });

    if (!reduced) {
      import("/vendor/lenis.mjs").then(({ default: Lenis }) => {
        if (disposed) return;
        lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, anchors: true, autoRaf: false });
      }).catch((error) => console.warn("lenis unavailable; native scroll", error));
    }

    return {
      app,
      root,
      setMessage(text) {
        message.textContent = text || "";
        message.hidden = !text;
      },
      destroy() {
        disposed = true;
        stopLoop();
        resizeObserver.disconnect();
        window.removeEventListener("resize", queueMeasure);
        if (lenis) { lenis.destroy(); lenis = null; }
      },
    };
  }

  let current = null;
  const api = {
    mount(app, message = "") {
      if (current && current.app === app && app.contains(current.root)) { current.setMessage(message); return; }
      api.unmount();
      const root = document.getElementById("nod-landing").content.firstElementChild.cloneNode(true);
      app.replaceChildren(root);
      current = createLanding(app, root);
      current.setMessage(message);
    },
    unmount() {
      if (current) { current.destroy(); current = null; }
    },
  };
  reducedQuery.addEventListener("change", () => {
    if (!current) return;
    const { app } = current;
    const text = current.root.querySelector("[data-message]").textContent;
    api.unmount();
    api.mount(app, text);
  });
  window.NodLanding = api;
})();
