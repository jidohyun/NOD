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

  /* Hero plate geometry, in plate pixels (1536x1024). QUAD is the ruled area of the right page (top-left, top-right,
     bottom-right, bottom-left); the 12 rows match the ruling lines detected in the image (see .ld-page rows in landing.css). */
  const PLATE_W = 1536;
  const PLATE_H = 1024;
  const PAGE_W = 1000;
  const PAGE_H = 1200;
  const QUAD = [[458, 215], [1150, 143], [1420, 697], [566, 820]];
  const NEW_ROW_MID = (792.1 + 894.6) / 2;

  function homography(src, dst) {
    const A = [];
    const b = [];
    for (let i = 0; i < 4; i += 1) {
      const [x, y] = src[i];
      const [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    for (let i = 0; i < 8; i += 1) {
      let m = i;
      for (let r = i + 1; r < 8; r += 1) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
      [A[i], A[m]] = [A[m], A[i]]; [b[i], b[m]] = [b[m], b[i]];
      for (let r = i + 1; r < 8; r += 1) {
        const f = A[r][i] / A[i][i];
        for (let c = i; c < 8; c += 1) A[r][c] -= f * A[i][c];
        b[r] -= f * b[i];
      }
    }
    const h = new Array(8);
    for (let i = 7; i >= 0; i -= 1) {
      let s = b[i];
      for (let c = i + 1; c < 8; c += 1) s -= A[i][c] * h[c];
      h[i] = s / A[i][i];
    }
    return h;
  }
  const mapPoint = (h, x, y) => {
    const w = h[6] * x + h[7] * y + 1;
    return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
  };
  const matrix3d = (h) => `matrix3d(${[h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, 1].join(",")})`;

  // Row bottoms of the ruled page in page units, from the ruling lines (the same fr values as .ld-page rows in landing.css).
  const ROW_FR = [89.3, 95.9, 99.6, 100.5, 101, 101.4, 101.4, 103, 102.5, 101.8, 100.8, 103];
  const ROW_BOTTOM = (() => { const total = ROW_FR.reduce((a, b) => a + b, 0); let acc = 0; return ROW_FR.map((f) => (acc += f) / total * PAGE_H); })();
  const HERO_END = 0.2;
  // Portrait screens reach a cover framing (the photo fills the stage under the header) by this progress.
  const STACK_COVER = 0.25;
  const lerp = (a, b, t) => a + (b - a) * t;

  function heroScene(el, reduced, start) {
    const words = splitWords(el.querySelector("[data-words]"));
    const plate = el.querySelector("[data-plate]");
    const copy = el.querySelector("[data-hero-copy]");
    const action = copy.querySelector(".ld-hero__action");
    const scrim = el.querySelector("[data-scrim]");
    const cam = el.querySelector("[data-cam]");
    const inkMask = el.querySelector("[data-ink-mask]");
    const inkCam = el.querySelector("[data-cam-ink]");
    const stage = el.querySelector(".ld-plate__stage");
    const header = document.querySelector(".ld-header");
    const title = el.querySelector("[data-title]");
    const mark = el.querySelector("[data-hero-mark]");
    const full = title.textContent;
    const ink = [...el.querySelectorAll("[data-row]")].map((row) => ({
      row, no: row.querySelector(".ld-entry__no"), title: row.querySelector(".ld-entry__title"), src: row.querySelector(".ld-entry__src"),
      intro: reduced ? 1 : 0, ends: null,
    }));
    const h = homography([[0, 0], [PAGE_W, 0], [PAGE_W, PAGE_H], [0, PAGE_H]], QUAD);
    el.querySelector("[data-page]").style.transform = matrix3d(h);
    const measureCtx = document.createElement("canvas").getContext("2d");
    const textWidth = (node, text) => {
      const cs = getComputedStyle(node);
      measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      measureCtx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      return measureCtx.measureText(text).width;
    };
    const typeAt = 700;
    const charMs = 34;
    const done = typeAt + full.length * charMs + 120;
    const g = { vh: 1, vw: 1, top: 0, height: 1, cover: 1, zoom: 1, sx: PLATE_W / 2, sy: PLATE_H / 2, fx: PLATE_W / 2, fy: PLATE_H / 2, hs: 1, htx: 0, hty: 0, hb: 0, sc: 1, se: 1, k0: 1 };
    let typed = -1;
    let lastExit = -1;
    let lastP = -1;
    let settled = reduced;

    if (!reduced) {
      title.textContent = "";
      ink.forEach((r) => { r.row.style.opacity = "0"; });
    }
    // The copy fades while the camera leaves the hero framing; a keyboard user who tabs back to it gets the hero back.
    copy.addEventListener("focusin", () => { if (lastP > 0.04) window.scrollTo(0, 0); });

    // Camera translate (screen = plate * s + t) with the centre clamped so the plate always covers the stage.
    function clampedPose(s, x, y) {
      const hx = g.vw / (2 * s);
      const hy = g.vh / (2 * s);
      const cx = Math.min(PLATE_W - hx, Math.max(hx, x));
      const cy = Math.min(PLATE_H - hy, Math.max(hy, y));
      return [s, g.vw / 2 - cx * s, g.vh / 2 - cy * s];
    }
    // p 0..HERO_END: from the hero framing (photo beside or under the copy) to the cover framing.
    // p HERO_END..0.8: dolly toward row 0413 and stop where the row fits the screen.
    function pose(p) {
      if (g.stacked) {
        // Portrait: from the whole page under the copy, zoom to the cover scale by STACK_COVER, then dolly to row 0413.
        // Until the plate is taller than the stage below the header it stays on the bottom edge (the scrim follows its
        // top edge); from STACK_COVER on it covers everything below the header. The edge mask fades the rows instead.
        const s = p < STACK_COVER ? lerp(g.hs, g.sc, easeInOut(p / STACK_COVER)) : lerp(g.sc, g.se, easeInOut(map(p, STACK_COVER, 0.8)));
        const k = easeInOut(map(p, 0, 0.8));
        const cx = lerp(g.hcx, g.fx, k);
        const cy = lerp(g.hcy, g.fy, k);
        const tx = Math.min(0, Math.max(g.vw - PLATE_W * s, g.vw / 2 - cx * s));
        const low = g.vh - PLATE_H * s;
        const ty = low >= g.hb ? low : Math.min(g.hb, Math.max(low, (g.hb + g.vh) / 2 - cy * s));
        return [s, tx, ty];
      }
      const [bs, btx, bty] = clampedPose(g.cover, g.sx, g.sy);
      if (p < HERO_END) {
        const e = easeInOut(p / HERO_END);
        return [lerp(g.hs, bs, e), lerp(g.htx, btx, e), lerp(g.hty, bty, e)];
      }
      const k = easeInOut(map(p, HERO_END, 0.8));
      const s = g.cover + (g.zoom - g.cover) * k;
      return clampedPose(s, g.sx + (g.fx - g.sx) * k, g.sy + (g.fy - g.sy) * k);
    }
    // A row (number + title) or a source fades out before any glyph reaches a screen edge, so nothing on screen is cut.
    const fit = (x0, x1) => clamp01((Math.min(x0, g.vw - x1) - 2) / 14);

    function frame(p) {
      const [s, tx, ty] = pose(p);
      const camT = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
      put(cam, "transform", camT);
      put(mark, "--mark", reduced ? "1" : easeOut(map(p, 0.55, 0.86)).toFixed(4));
      put(copy, "opacity", (1 - map(p, 0.05, 0.17)).toFixed(3));
      if (g.stacked) {
        // The edge mask starts stretched past the screen edges (the first screen shows every row whole) and settles on
        // the edges before any glyph gets there; the ink camera undoes the stretch, so the rows stay on the paper.
        const settle = map(p, 0, 0.03);
        const m = settle === 1 ? 1 : lerp(g.k0, 1, easeOut(settle));
        const c = g.vw / 2;
        put(inkMask, "transform", m === 1 ? "none" : `scaleX(${m.toFixed(4)})`);
        put(inkCam, "transform", m === 1 ? camT : `translate3d(${(c + (tx - c) / m).toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${(s / m).toFixed(4)}, ${s.toFixed(4)})`);
        const wash = (1 - easeInOut(map(p, 0.08, STACK_COVER))).toFixed(3);
        put(scrim, "transform", `translate3d(0, ${Math.min(0, ty - g.hty).toFixed(2)}px, 0)`);
        put(scrim, "opacity", wash);
        put(stage, "--wash", wash);
        for (const r of ink) put(r.row, "opacity", r.intro.toFixed(3));
      } else {
        put(inkCam, "transform", camT);
        put(scrim, "opacity", (1 - easeInOut(map(p, 0.08, HERO_END))).toFixed(3));
        for (const r of ink) {
          if (!r.ends) continue;
          const [a, b, c, d] = r.ends.map((pt) => pt[0] * s + tx);
          put(r.row, "opacity", (r.intro * fit(a, b)).toFixed(3));
          put(r.src, "opacity", fit(c, d).toFixed(3));
        }
      }
    }

    return {
      measure(vh, vw) {
        g.vh = vh; g.vw = vw; g.top = docTop(plate); g.height = plate.offsetHeight;
        g.cover = Math.max(vw / PLATE_W, vh / PLATE_H) * 1.02;
        const narrow = vw <= 760;
        // Glyph extents of each row in plate pixels: number start, title end, source start, source end (at the text's mid-line).
        ink.forEach((r, i) => {
          const y = ROW_BOTTOM[i] - 30;
          const isNew = i === ink.length - 1;
          const tw = Math.min(640, textWidth(r.title, isNew ? full : r.title.textContent)) + (isNew ? 10 : 0);
          const sw = Math.min(210, textWidth(r.src, r.src.textContent));
          r.ends = [mapPoint(h, 22, y), mapPoint(h, 132 + tw, y), mapPoint(h, PAGE_W - 18 - sw, y), mapPoint(h, PAGE_W - 18, y)];
        });
        const edge = parseFloat(getComputedStyle(inkMask).getPropertyValue("--edge-b")) || 32;
        if (narrow) {
          // Narrow screens end on row 0413: its number and title fit between the faded edges.
          const [no, end] = ink[ink.length - 1].ends;
          g.zoom = (vw - 2 * (edge + 6)) / (end[0] - no[0]);
          g.fx = (no[0] + end[0]) / 2;
          g.fy = (no[1] + end[1]) / 2;
        } else {
          // Wide screens frame the whole new row.
          const a = mapPoint(h, 0, NEW_ROW_MID);
          const b = mapPoint(h, PAGE_W, NEW_ROW_MID);
          const span = Math.hypot(b[0] - a[0], b[1] - a[1]);
          g.zoom = Math.max(g.cover, Math.min(g.cover * 1.8, (vw * 0.8) / span));
          g.fx = (a[0] + b[0]) / 2; g.fy = (a[1] + b[1]) / 2;
        }
        // Landscape dolly starts from the plate centre (portrait screens use their own path, see pose()).
        g.sx = PLATE_W / 2; g.sy = PLATE_H / 2;
        // Hero framing. Landscape: the written page fills the right side beside the copy, the plate covers the height.
        // Portrait: the whole page fits the width and the plate sits under the call to action.
        const left = QUAD[0][0];
        const right = QUAD[2][0];
        g.hold = Math.max(0, action.offsetTop + action.offsetHeight + 24 - vh);
        g.stacked = !(vw > 760 && vw > vh);
        g.hb = header ? header.offsetHeight : 0;
        put(scrim, "opacity", "1");
        put(scrim, "transform", "none");
        put(stage, "--wash", "1");
        put(inkMask, "transform", "none");
        inkMask.classList.toggle("ld-plate__ink--edge", g.stacked);
        if (!g.stacked) {
          const range = document.createRange();
          let textRight = 0;
          for (const node of copy.querySelectorAll("h1, .ld-lede, .ld-hero__action > a")) {
            range.selectNodeContents(node);
            textRight = Math.max(textRight, range.getBoundingClientRect().right);
          }
          const pageLeft = Math.max(vw * 0.46, textRight + 48);
          let s = vh / PLATE_H;
          if (pageLeft + (PLATE_W - left) * s < vw) s = (vw - pageLeft) / (PLATE_W - left);
          g.hs = s; g.htx = pageLeft - left * s;
          const mid = (QUAD[1][1] + QUAD[3][1]) / 2;
          g.hty = Math.min(0, Math.max(vh - PLATE_H * s, (72 + (vh - 72) / 2) - mid * s));
          scrim.style.setProperty("--scrim-dir", "90deg");
          scrim.style.setProperty("--scrim-a", `${Math.round(pageLeft - 150)}px`);
          scrim.style.setProperty("--scrim-b", `${Math.round(pageLeft - 10)}px`);
        } else {
          const s = (vw - 20) / (right - left);
          g.hs = s; g.htx = 10 - left * s; g.hty = vh - PLATE_H * s;
          g.hcx = (vw / 2 - g.htx) / s; g.hcy = ((g.hb + vh) / 2 - g.hty) / s;
          // Cover scale: the plate fills the width and the stage below the header. The dolly never ends below it.
          g.sc = Math.max(vw / PLATE_W, (vh - g.hb) / PLATE_H);
          g.se = Math.max(g.sc, g.zoom);
          // Mask stretch for the first screen: its fade ends 4px before the glyph nearest a screen edge.
          let near = vw / 2;
          for (const r of ink) for (const pt of r.ends) near = Math.min(near, pt[0] * s + g.htx, vw - (pt[0] * s + g.htx));
          g.k0 = Math.max(1, (vw / 2 - (near - 4)) / (vw / 2 - edge));
          ink.forEach((r) => put(r.src, "opacity", "1"));
          const below = Math.max(action.offsetTop + action.offsetHeight + 8, g.hty);
          scrim.style.setProperty("--scrim-dir", "180deg");
          scrim.style.setProperty("--scrim-a", `${Math.round(below)}px`);
          scrim.style.setProperty("--scrim-b", `${Math.round(below + 56)}px`);
        }
        lastP = -1;
      },
      render(y, now) {
        let busy = false;
        let introMoved = false;
        if (!settled) {
          const t = now - start;
          ink.forEach((r, i) => { r.intro = easeOut(map(t, 160 + i * 60, 760 + i * 60)); });
          introMoved = true;
          const n = Math.min(full.length, Math.max(0, Math.floor((t - typeAt) / charMs)));
          if (n !== typed) { typed = n; title.textContent = full.slice(0, n); }
          settled = t > done;
          busy = !settled;
        }
        // On a short screen the copy is taller than the stage: hold the scene until the call to action has scrolled into view.
        const p = reduced ? 0 : clamp01((y - g.top - g.hold) / Math.max(1, g.height - g.vh - g.hold));
        if (p !== lastP || introMoved) { lastP = p; frame(p); }
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
    const card = el.querySelector("[data-card]");
    const base = 413;
    const g = { top: 0, height: 1, vh: 1, rowH: 64 };
    const rows = BASE.map(([no, t, s]) => ledgerRow(no, t, s));
    rows.forEach((r) => stack.append(r.node));
    let scrollSaves = reduced ? THRESHOLDS.length : 0;
    let clickSaves = 0;
    let shown = base;
    let pressAt = -1e9;
    let lastTotal = -1;
    let drop = reduced ? 1 : 0;

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
          drop = easeInOut(map(p, 0.06, 0.66));
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
        // The card sinks into its slot with the scroll; each save lifts it once, like a card being filed.
        const lift = !reduced && t < 600 ? Math.sin(Math.PI * map(t, 0, 600)) * 10 : 0;
        put(card, "transform", `translate3d(0, ${(-(1 - drop) * 70 - lift).toFixed(2)}%, 0) rotate(${(-(1 - drop) * 3).toFixed(2)}deg)`);
        put(card, "--sink", drop.toFixed(3));
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
