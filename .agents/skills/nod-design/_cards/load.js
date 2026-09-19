// Dev loader for specimen cards: fetches component .jsx sources, transpiles with Babel standalone,
// resolves relative imports to blob module URLs, and returns the merged exports.
// Requires window.Babel (Babel standalone). Bare "react" imports are rewritten to esm.sh (no import map needed).
export const REACT_URL = "https://esm.sh/react@18.3.1";
export const REACT_DOM_CLIENT_URL = "https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1";
const cache = new Map();
async function toBlobUrl(url) {
  const abs = new URL(url, location.href).href;
  if (cache.has(abs)) return cache.get(abs);
  const p = (async () => {
    const src = await (await fetch(abs, { cache: "no-store" })).text();
    let code = window.Babel.transform(src, { presets: [["react", { runtime: "classic" }]], filename: abs }).code;
    code = code.split("import.meta.url").join(JSON.stringify(abs));
    code = code.replace(/from\s+["']react["']/g, 'from "' + REACT_URL + '"');
    const deps = [...code.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)].map(m => m[1]);
    for (const d of new Set(deps)) {
      const blob = await toBlobUrl(new URL(d, abs).href);
      code = code.split(`"${d}"`).join(`"${blob}"`).split(`'${d}'`).join(`'${blob}'`);
    }
    return URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  })();
  cache.set(abs, p);
  return p;
}
export async function load(paths) {
  const mods = await Promise.all(paths.map(async p => import(await toBlobUrl(p))));
  return Object.assign({}, ...mods);
}

/** Render a JSX expression (text of a <script type="text/plain"> block) with the named components loaded from paths. */
export async function mount(selector, components, jsxSource) {
  const React = (await import(REACT_URL)).default;
  const { createRoot } = await import(REACT_DOM_CLIENT_URL);
  const names = Object.keys(components);
  const lib = await load(Object.values(components));
  const src = 'import React from "react";\nexport default ({' + names.join(', ') + '}) => (' + jsxSource + ');';
  let code = window.Babel.transform(src, { presets: [["react", { runtime: "classic" }]], filename: "card.jsx" }).code.replace(/from\s+["']react["']/g, 'from "' + REACT_URL + '"');
  const Card = (await import(URL.createObjectURL(new Blob([code], { type: "text/javascript" })))).default;
  createRoot(document.querySelector(selector)).render(React.createElement(Card, lib));
}
