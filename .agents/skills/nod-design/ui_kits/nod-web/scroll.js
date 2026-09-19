// Minimal scroll-progress toolkit (pattern from the Hirst teardown: progress 0–1 → linear mapping), no motion lib.
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** map v from [i0,i1] to [o0,o1] with clamping */
export const map = (v, [i0, i1], [o0, o1]) => lerp(o0, o1, clamp01((v - i0) / (i1 - i0)));
export const REDUCED = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Single rAF-driven progress source. mode "pin": ["start start","end end"]; mode "view": ["start end","end start"]. */
export function createProgress(el, mode = "pin") {
  const subs = new Set(); let value = -1; let raf = 0; let visible = true;
  const compute = () => {
    const r = el.getBoundingClientRect(); const vh = window.innerHeight;
    return mode === "pin" ? clamp01(-r.top / Math.max(1, el.offsetHeight - vh)) : clamp01((vh - r.top) / (vh + el.offsetHeight));
  };
  const tick = () => { raf = 0; const v = compute(); if (v !== value) { value = v; subs.forEach((f) => f(v)); } };
  const onScroll = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) onScroll(); }, { rootMargin: "50% 0px 50% 0px" });
  io.observe(el);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  tick();
  return {
    get: () => value,
    on: (f) => { subs.add(f); f(value); return () => subs.delete(f); },
    destroy: () => { io.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); },
  };
}

/** Lenis smooth scroll (duration 1.1, expo-out, no smoothTouch). Skipped under reduced motion. */
export async function startLenis() {
  if (REDUCED) return () => {};
  try {
    const { default: Lenis } = await import("https://esm.sh/lenis@1.3.23");
    const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, smoothTouch: false });
    window.__lenis = lenis;
    let id; const raf = (t) => { lenis.raf(t); id = requestAnimationFrame(raf); }; id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  } catch (e) { console.warn("lenis unavailable", e); return () => {}; }
}
