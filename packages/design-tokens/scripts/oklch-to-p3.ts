import { clamp } from "es-toolkit";
import type { OklchColor } from "../src/tokens.js";

export interface P3Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface OkLabColor {
  L: number;
  a: number;
  b: number;
}

export function oklchToOklab(oklch: OklchColor): OkLabColor {
  const hRad = (oklch.h * Math.PI) / 180;
  return {
    L: oklch.l,
    a: oklch.c * Math.cos(hRad),
    b: oklch.c * Math.sin(hRad),
  };
}

export function oklabToLinearSrgb(lab: OkLabColor): [number, number, number] {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function linearSrgbToXyz(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  return [
    0.4123907993 * r + 0.357584339 * g + 0.1804807884 * b,
    0.21263901 * r + 0.715168678 * g + 0.072192315 * b,
    0.0193308187 * r + 0.11919478 * g + 0.9505321522 * b,
  ];
}

export function xyzToLinearP3(xyz: [number, number, number]): [number, number, number] {
  const [x, y, z] = xyz;
  return [
    2.4934969119 * x - 0.9313836179 * y - 0.4027107845 * z,
    -0.8294889696 * x + 1.7626640603 * y + 0.0236246858 * z,
    0.0358458302 * x - 0.0761723893 * y + 0.9568845241 * z,
  ];
}

export function gammaEncode(linear: number): number {
  if (linear <= 0.0031308) {
    return 12.92 * linear;
  }
  return 1.055 * linear ** (1 / 2.4) - 0.055;
}

export function oklchToP3(oklch: OklchColor): P3Color {
  const oklab = oklchToOklab(oklch);
  const linearSrgb = oklabToLinearSrgb(oklab);
  const xyz = linearSrgbToXyz(linearSrgb);
  const linearP3 = xyzToLinearP3(xyz);

  return {
    r: clamp(gammaEncode(linearP3[0]), 0, 1),
    g: clamp(gammaEncode(linearP3[1]), 0, 1),
    b: clamp(gammaEncode(linearP3[2]), 0, 1),
    a: oklch.a ?? 1,
  };
}

export function oklchToCss(oklch: OklchColor): string {
  const { l, c, h, a } = oklch;
  if (a !== undefined && a < 1) {
    return `oklch(${l} ${c} ${h} / ${a})`;
  }
  return `oklch(${l} ${c} ${h})`;
}

export function p3ToFlutterColor(p3: P3Color): string {
  return `Color.from(alpha: ${p3.a.toFixed(3)}, red: ${p3.r.toFixed(4)}, green: ${p3.g.toFixed(4)}, blue: ${p3.b.toFixed(4)}, colorSpace: ColorSpace.displayP3)`;
}

export function p3ToHex(p3: P3Color): string {
  const toHex = (v: number) =>
    Math.round(clamp(v, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");

  const hex = `#${toHex(p3.r)}${toHex(p3.g)}${toHex(p3.b)}`;
  if (p3.a < 1) {
    return `${hex}${toHex(p3.a)}`;
  }
  return hex;
}
