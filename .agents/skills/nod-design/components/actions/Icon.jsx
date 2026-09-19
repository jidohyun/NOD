import React from "react";
/** Material Symbols Outlined glyph. size: 20 | 24 | 32 | 48 */
export function Icon({ name, size = 24, fill = 0, label, style }) {
  return (
    <span className="material-symbols-outlined" aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined}
      style={{ fontSize: size, width: size, height: size, fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" ${size >= 40 ? 48 : size <= 20 ? 20 : 24}`, ...style }}>
      {name}
    </span>
  );
}
