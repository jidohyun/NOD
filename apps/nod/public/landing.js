/* NOD landing behaviour (landing-interaction-standard.md §0): one requestAnimationFrame loop drives Lenis and every scene.
   Scroll-linked values come from one progress value per scene, using geometry cached on resize. Discrete events
   (a save, a search, a pointer) ease toward their targets in the same loop. Every frame writes transform/opacity only. */
(() => {
  "use strict";

  const DEPTHS = [10, 14, 12, 16, 13, 17, 11, 15];
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const map = (v, a, b) => clamp01((v - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  const pad = (n) => String(Math.max(0, Math.round(n))).padStart(4, "0");
  const approach = (current, target, k) => (Math.abs(target - current) < 0.002 ? target : current + (target - current) * k);
  const written = new WeakMap();
  function put(node, prop, value) {
    let cache = written.get(node);
    if (!cache) { cache = {}; written.set(node, cache); }
    if (cache[prop] === value) return;
    cache[prop] = value;
    if (prop.startsWith("--")) node.style.setProperty(prop, value);
    else node.style[prop] = value;
  }

  function splitWords(heading) {
    const label = heading.textContent.replace(/\s+/g, " ").trim();
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

  function progressOf(g, y) {
    return clamp01((y - g.top) / Math.max(1, g.height - g.vh));
  }

  function heroScene(el, reduced, start) {
    const words = splitWords(el.querySelector("[data-words]"));
    const rows = [...el.querySelectorAll("[data-row]")];
    const title = el.querySelector("[data-title]");
    const mark = el.querySelector(".ld-mark");
    const full = title.textContent;
    const typeAt = 520;
    const charMs = 34;
    const markAt = typeAt + full.length * charMs + 120;
    const done = markAt + 480;
    const g = { vh: 1 };
    let typed = -1;
    let lastExit = -1;
    let settled = reduced;

    if (reduced) mark.style.setProperty("--mark", "1");
    else {
      title.textContent = "";
      mark.style.setProperty("--mark", "0");
      rows.forEach((r) => { r.style.opacity = "0"; });
    }

    return {
      measure(vh) { g.vh = vh; },
      render(y, now) {
        let busy = false;
        if (!settled) {
          const t = now - start;
          rows.forEach((row, i) => {
            const e = easeOut(map(t, 160 + i * 90, 900 + i * 90));
            row.style.opacity = String(e);
            row.style.transform = `translate3d(0, ${((1 - e) * 22).toFixed(2)}px, 0)`;
          });
          const n = Math.min(full.length, Math.max(0, Math.floor((t - typeAt) / charMs)));
          if (n !== typed) { typed = n; title.textContent = full.slice(0, n); }
          mark.style.setProperty("--mark", easeOut(map(t, markAt, markAt + 420)).toFixed(4));
          settled = t > done;
          busy = !settled;
        }
        if (reduced || y > g.vh * 1.5) return busy;
        const exit = clamp01(y / (g.vh * 0.9));
        if (exit !== lastExit) {
          lastExit = exit;
          words.forEach((w, i) => { w.style.transform = `translate3d(0, ${(-exit * DEPTHS[i % 8] * 0.6).toFixed(2)}vh, 0)`; });
        }
        return busy;
      },
    };
  }

  const SAMPLES = [
    ["A field guide to good defaults", "rauno.me"],
    ["The page you meant to finish", "nytimes.com"],
    ["Small tools, sharp edges", "arstechnica.com"],
    ["How we built a calm inbox", "hey.com"],
    ["Notes on typography for the web", "practicaltypography.com"],
    ["What to cook this week", "bonappetit.com"],
  ];
  const BASE = [["0410", "Optimize Largest Contentful Paint", "web.dev"], ["0411", "position: sticky", "developer.mozilla.org"], ["0412", "How to write a README people read", "github.com"], ["0413", "The page you’re reading", "nod-archive.com"]];
  const THRESHOLDS = [0.16, 0.4, 0.64];

  function ledgerRow(no, title, src) {
    const li = document.createElement("div");
    li.className = "ld-row";
    const n = document.createElement("span"); n.className = "ld-row__no"; n.textContent = no;
    const t = document.createElement("span"); t.className = "ld-row__title";
    const m = document.createElement("span"); m.className = "ld-mark"; m.setAttribute("aria-hidden", "true");
    t.append(m, document.createTextNode(title));
    const s = document.createElement("span"); s.className = "ld-row__src"; s.textContent = src;
    li.append(n, t, s);
    return { node: li, mark: m, y: 0, o: 1, k: 0, alive: true };
  }

  function saveScene(el, reduced) {
    const stack = el.querySelector("[data-stack]");
    const counter = el.querySelector("[data-counter]");
    const key = el.querySelector("[data-savekey]");
    const live = el.querySelector("[data-save-live]");
    const base = 413;
    const g = { top: 0, height: 1, vh: 1, rowH: 64 };
    const rows = BASE.map(([no, t, s]) => ledgerRow(no, t, s));
    rows.forEach((r) => stack.append(r.node));
    let scrollSaves = reduced ? THRESHOLDS.length : 0;
    let clickSaves = 0;
    let shown = base;
    let pressAt = -1e9;
    let lastTotal = -1;

    function sync(now) {
      const total = scrollSaves + clickSaves;
      if (total === lastTotal) return;
      if (lastTotal >= 0 && total > lastTotal) pressAt = now;
      lastTotal = total;
      const want = BASE.length + total;
      let alive = rows.filter((r) => r.alive);
      while (alive.length < want) {
        const i = alive.length - BASE.length;
        const [t, s] = SAMPLES[i % SAMPLES.length];
        const r = ledgerRow(pad(base + 1 + i), t, s);
        r.y = -g.rowH * 0.7; r.o = 0; r.k = 0;
        if (reduced) { r.o = 1; }
        stack.prepend(r.node);
        rows.push(r);
        alive = rows.filter((x) => x.alive);
      }
      while (alive.length > want) { alive[alive.length - 1].alive = false; alive.pop(); }
    }

    key.addEventListener("click", () => {
      clickSaves += 1;
      live.textContent = `Saved No. ${pad(base + scrollSaves + clickSaves)}.`;
    });

    return {
      measure(vh, vw) {
        g.rowH = vw <= 760 ? 68 : 64;
        stack.style.setProperty("--row-h", `${g.rowH}px`);
        g.top = docTop(el); g.height = el.offsetHeight; g.vh = vh;
      },
      render(y, now, k) {
        if (!reduced && y >= g.top - g.vh && y <= g.top + g.height) {
          const p = progressOf(g, y);
          scrollSaves = THRESHOLDS.filter((t) => p >= t).length;
        }
        sync(now);
        const step = reduced ? 1 : k;
        const alive = rows.filter((r) => r.alive);
        let busy = false;
        for (let i = rows.length - 1; i >= 0; i -= 1) {
          const r = rows[i];
          const idx = alive.indexOf(r);
          const ty = r.alive ? (alive.length - 1 - idx) * g.rowH : -g.rowH * 0.7;
          const to = r.alive ? 1 : 0;
          const tk = r.alive && idx === alive.length - 1 ? 1 : 0;
          r.y = approach(r.y, ty, step); r.o = approach(r.o, to, step); r.k = approach(r.k, tk, step * 0.8);
          put(r.node, "transform", `translate3d(0, ${r.y.toFixed(1)}px, 0)`);
          put(r.node, "opacity", r.o.toFixed(3));
          put(r.mark, "--mark", r.k.toFixed(3));
          if (r.isNew !== (tk === 1)) { r.isNew = tk === 1; r.node.classList.toggle("ld-row--new", r.isNew); }
          if (r.y !== ty || r.o !== to || r.k !== tk) busy = true;
          if (!r.alive && r.o === 0) { r.node.remove(); rows.splice(i, 1); }
        }
        const target = base + scrollSaves + clickSaves;
        shown = approach(shown, target, reduced ? 1 : k * 0.7);
        if (shown !== target) busy = true;
        const text = pad(shown);
        if (counter.textContent !== text) counter.textContent = text;
        const t = now - pressAt;
        if (!reduced && t < 600) {
          put(key, "--press", (1 - 0.14 * Math.sin(Math.PI * map(t, 0, 260))).toFixed(4));
          put(key, "--ring", (1 - map(t, 60, 560)).toFixed(4));
          busy = true;
        } else {
          put(key, "--press", "1");
          put(key, "--ring", "0");
        }
        return busy;
      },
    };
  }

  function colsScene(el, reduced) {
    const drop = el.querySelector("[data-drop]");
    const cols = [...el.querySelectorAll("[data-dropcol]")];
    const after = el.querySelector("[data-after]");
    const g = { top: 0, height: 1, vh: 1, w: 0, narrow: false };
    let last = -1;
    return {
      measure(vh, vw) { g.top = docTop(el); g.height = el.offsetHeight; g.vh = vh; g.w = drop.offsetWidth; g.narrow = vw <= 1024; last = -1; },
      render(y) {
        if (!reduced && (y < g.top - g.vh || y > g.top + g.height)) return false;
        const p = reduced ? 0.6 : progressOf(g, y);
        if (p === last) return false;
        last = p;
        cols.forEach((col, i) => put(col, "--s", easeOut(map(p, 0.06 + i * 0.1, 0.2 + i * 0.1)).toFixed(3)));
        const c = easeInOut(map(p, 0.58, 0.8));
        put(drop, "opacity", (1 - c * (g.narrow ? 0.8 : 1)).toFixed(3));
        put(drop, "transform", g.narrow
          ? `translate3d(0, ${(-c * 10).toFixed(2)}px, 0)`
          : `translate3d(${(-c * g.w * 0.25).toFixed(1)}px, 0, 0) scaleX(${(1 - c * 0.5).toFixed(3)})`);
        put(after, "--after", reduced ? "1" : easeOut(map(p, 0.8, 0.94)).toFixed(3));
        return false;
      },
    };
  }

  function findScene(el, reduced) {
    const input = el.querySelector("[data-search]");
    const count = el.querySelector("[data-count]");
    const rows = [...el.querySelectorAll("[data-row]")].map((node) => {
      const title = node.querySelector(".ld-row__title");
      return { node, title, text: title.textContent, hay: node.textContent.toLowerCase(), v: 1, h: 0 };
    });
    const word = "design";
    const g = { top: 0, height: 1, vh: 1 };
    let user = false;
    let query = null;

    function apply(q) {
      if (q === query) return;
      query = q;
      const needle = q.trim().toLowerCase();
      let hits = 0;
      for (const r of rows) {
        r.match = !needle || r.hay.includes(needle);
        if (r.match) hits += 1;
        const at = needle ? r.text.toLowerCase().indexOf(needle) : -1;
        if (at < 0) { r.title.textContent = r.text; continue; }
        const mark = document.createElement("span");
        mark.className = "ld-hit";
        mark.textContent = r.text.slice(at, at + needle.length);
        r.title.replaceChildren(r.text.slice(0, at), mark, r.text.slice(at + needle.length));
      }
      count.textContent = needle ? `${hits} of ${rows.length}` : `${rows.length} links`;
    }

    input.addEventListener("input", () => { user = input.value.length > 0 || document.activeElement === input; apply(input.value); });
    input.addEventListener("blur", () => { if (!input.value) user = false; });
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") { input.value = ""; user = false; apply(""); } });

    return {
      measure(vh) { g.top = docTop(el); g.height = el.offsetHeight; g.vh = vh; for (const r of rows) r.h = r.node.offsetHeight; },
      render(y, now, k) {
        const inRange = y >= g.top - g.vh && y <= g.top + g.height;
        if (!inRange && !user && !reduced && query !== null && rows.every((r) => r.v === (r.match ? 1 : 0))) return false;
        if (!user) {
          const p = reduced ? 1 : progressOf(g, y);
          const q = word.slice(0, Math.round(map(p, 0.12, 0.48) * word.length));
          if (reduced || inRange) { if (input.value !== q) input.value = q; apply(q); }
        }
        if (query === null) apply("");
        let shift = 0;
        let busy = false;
        for (const r of rows) {
          const to = r.match ? 1 : 0;
          r.v = approach(r.v, to, reduced ? 1 : k);
          if (r.v !== to) busy = true;
          put(r.node, "opacity", r.v.toFixed(3));
          put(r.node, "transform", `translate3d(0, ${(-shift).toFixed(1)}px, 0) scale(${(0.97 + 0.03 * r.v).toFixed(3)})`);
          shift += (1 - r.v) * r.h;
        }
        return busy;
      },
    };
  }

  function closingScene(el, reduced) {
    const words = splitWords(el.querySelector("[data-words]"));
    const g = { top: 0, height: 1, vh: 1 };
    return {
      measure(vh) { g.top = docTop(el); g.height = el.offsetHeight; g.vh = vh; },
      render(y) {
        if (reduced || y < g.top - g.vh || y > g.top + g.height) return false;
        const v = clamp01((y + g.vh - g.top) / (g.height + g.vh));
        words.forEach((w, i) => { w.style.transform = `translate3d(0, ${((0.5 - v) * DEPTHS[i % 8] * 0.6).toFixed(2)}vh, 0)`; });
        return false;
      },
    };
  }

  function magnets(root, reduced) {
    const items = [...root.querySelectorAll("[data-magnet]")].map((node) => ({ node, x: 0, y: 0, tx: 0, ty: 0 }));
    if (reduced || !finePointer.matches) return { render: () => false };
    for (const m of items) {
      m.node.addEventListener("pointermove", (e) => {
        const r = m.node.getBoundingClientRect();
        m.tx = Math.max(-10, Math.min(10, (e.clientX - (r.left + r.width / 2)) * 0.2));
        m.ty = Math.max(-6, Math.min(6, (e.clientY - (r.top + r.height / 2)) * 0.3));
      });
      m.node.addEventListener("pointerleave", () => { m.tx = 0; m.ty = 0; });
    }
    return {
      render(y, now, k) {
        let busy = false;
        for (const m of items) {
          const x = approach(m.x, m.tx, k);
          const yy = approach(m.y, m.ty, k);
          if (x === m.x && yy === m.y) continue;
          m.x = x; m.y = yy; busy = true;
          m.node.style.setProperty("--mx", `${x.toFixed(2)}px`);
          m.node.style.setProperty("--my", `${yy.toFixed(2)}px`);
        }
        return busy;
      },
    };
  }

  function createLanding(app, root) {
    const reduced = reducedQuery.matches;
    const start = performance.now();
    const scenes = [
      heroScene(root.querySelector('[data-scene="hero"]'), reduced, start),
      saveScene(root.querySelector('[data-scene="save"]'), reduced),
      colsScene(root.querySelector('[data-scene="cols"]'), reduced),
      findScene(root.querySelector('[data-scene="find"]'), reduced),
      closingScene(root.querySelector('[data-scene="closing"]'), reduced),
      magnets(root, reduced),
    ];
    const message = root.querySelector("[data-message]");
    let disposed = false;
    let lenis = null;
    let frameId = 0;
    let last = start;
    let measureQueued = false;

    const measure = () => {
      measureQueued = false;
      if (disposed) return;
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth;
      for (const scene of scenes) scene.measure?.(vh, vw);
      if (lenis) lenis.resize();
    };
    const queueMeasure = () => { if (!measureQueued) { measureQueued = true; requestAnimationFrame(measure); } };

    const tick = (now) => {
      if (disposed) return;
      if (lenis) lenis.raf(now);
      const dt = Math.min(64, now - last);
      last = now;
      const k = 1 - Math.exp(-dt / 85);
      const y = window.scrollY;
      for (const scene of scenes) scene.render(y, now, k);
      frameId = requestAnimationFrame(tick);
    };

    measure();
    window.addEventListener("resize", queueMeasure);
    const resizeObserver = new ResizeObserver(queueMeasure);
    resizeObserver.observe(root);
    document.fonts.ready.then(queueMeasure);
    frameId = requestAnimationFrame(tick);

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
        cancelAnimationFrame(frameId);
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
