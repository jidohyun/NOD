/**
 * Design Tokens - Single Source of Truth (OKLCH)
 *
 * OKLCH Color Space:
 * - L: Lightness (0-1)
 * - C: Chroma (0-0.4+, saturation)
 * - H: Hue (0-360, color wheel angle)
 *
 * These tokens are used to generate:
 * - Web: globals.css (OKLCH CSS variables)
 * - Flutter: FThemeData with P3 colors
 */

export interface OklchColor {
  /** Lightness: 0 (black) to 1 (white) */
  l: number;
  /** Chroma: 0 (gray) to 0.4+ (vivid) */
  c: number;
  /** Hue: 0-360 degrees on color wheel */
  h: number;
  /** Alpha: 0-1, defaults to 1 */
  a?: number;
}

/**
 * Helper to create OKLCH color objects concisely
 */
const oklch = (l: number, c: number, h: number, a?: number): OklchColor => ({
  l,
  c,
  h,
  ...(a !== undefined && { a }),
});

export const tokens = {
  // ==========================================================================
  // COLORS (OKLCH)
  // ==========================================================================
  color: {
    dark: {
      // Accent
      accent: oklch(0.269, 0, 0),
      accentForeground: oklch(0.985, 0, 0),
      // Background & Foreground
      background: oklch(0.145, 0, 0),

      // Border & Input (with alpha)
      border: oklch(1, 0, 0, 0.1),

      // Card
      card: oklch(0.205, 0, 0),
      cardForeground: oklch(0.985, 0, 0),

      // Chart Colors
      chart1: oklch(0.488, 0.243, 264.376),
      chart2: oklch(0.696, 0.17, 162.48),
      chart3: oklch(0.769, 0.188, 70.08),
      chart4: oklch(0.627, 0.265, 303.9),
      chart5: oklch(0.645, 0.246, 16.439),

      // Destructive
      destructive: oklch(0.704, 0.191, 22.216),
      destructiveForeground: oklch(0.985, 0, 0),
      foreground: oklch(0.985, 0, 0),
      input: oklch(1, 0, 0, 0.15),

      // Muted
      muted: oklch(0.269, 0, 0),
      mutedForeground: oklch(0.708, 0, 0),

      // Popover
      popover: oklch(0.205, 0, 0),
      popoverForeground: oklch(0.985, 0, 0),

      // Primary (Lime Green - same as light)
      primary: oklch(0.85, 0.2, 130),
      primaryForeground: oklch(0.205, 0, 0),
      ring: oklch(0.556, 0, 0),

      // Secondary
      secondary: oklch(0.269, 0, 0),
      secondaryForeground: oklch(0.985, 0, 0),

      // Sidebar
      sidebar: oklch(0.205, 0, 0),
      sidebarAccent: oklch(0.269, 0, 0),
      sidebarAccentForeground: oklch(0.985, 0, 0),
      sidebarBorder: oklch(1, 0, 0, 0.1),
      sidebarForeground: oklch(0.985, 0, 0),
      sidebarPrimary: oklch(0.488, 0.243, 264.376),
      sidebarPrimaryForeground: oklch(0.985, 0, 0),
      sidebarRing: oklch(0.556, 0, 0),
    },
    light: {
      // Accent
      accent: oklch(0.97, 0, 0),
      accentForeground: oklch(0.205, 0, 0),
      // Background & Foreground
      background: oklch(1, 0, 0),

      // Border & Input
      border: oklch(0.922, 0, 0),

      // Card
      card: oklch(1, 0, 0),
      cardForeground: oklch(0.145, 0, 0),

      // Chart Colors
      chart1: oklch(0.646, 0.222, 41.116),
      chart2: oklch(0.6, 0.118, 184.704),
      chart3: oklch(0.398, 0.07, 227.392),
      chart4: oklch(0.828, 0.189, 84.429),
      chart5: oklch(0.769, 0.188, 70.08),

      // Destructive
      destructive: oklch(0.577, 0.245, 27.325),
      destructiveForeground: oklch(1, 0, 0),
      foreground: oklch(0.145, 0, 0),
      input: oklch(0.922, 0, 0),

      // Muted
      muted: oklch(0.97, 0, 0),
      mutedForeground: oklch(0.556, 0, 0),

      // Popover
      popover: oklch(1, 0, 0),
      popoverForeground: oklch(0.145, 0, 0),

      // Primary (Lime Green)
      primary: oklch(0.85, 0.2, 130),
      primaryForeground: oklch(0.205, 0, 0),
      ring: oklch(0.708, 0, 0),

      // Secondary
      secondary: oklch(0.97, 0, 0),
      secondaryForeground: oklch(0.205, 0, 0),

      // Sidebar
      sidebar: oklch(0.985, 0, 0),
      sidebarAccent: oklch(0.97, 0, 0),
      sidebarAccentForeground: oklch(0.205, 0, 0),
      sidebarBorder: oklch(0.922, 0, 0),
      sidebarForeground: oklch(0.145, 0, 0),
      sidebarPrimary: oklch(0.205, 0, 0),
      sidebarPrimaryForeground: oklch(0.985, 0, 0),
      sidebarRing: oklch(0.708, 0, 0),
    },
  },

  // ==========================================================================
  // RADIUS (pixels)
  // ==========================================================================
  radius: {
    /** Base radius: 10px (--radius: 0.625rem) */
    base: 10,
    /** Large: base */
    lg: 10,
    /** Medium: base - 2px */
    md: 8,
    /** Small: base - 4px */
    sm: 6,
    /** Extra large: base + 4px */
    xl: 14,
  },

  // ==========================================================================
  // SEMANTIC COLORS (for convenience)
  // ==========================================================================
  semantic: {
    info: oklch(0.6, 0.2, 260),
    success: oklch(0.65, 0.2, 145),
    warning: oklch(0.75, 0.18, 85),
  },

  // ==========================================================================
  // SPACING (pixels)
  // ==========================================================================
  spacing: {
    "2xl": 32,
    "3xl": 48,
    base: 16,
    lg: 20,
    md: 12,
    sm: 8,
    xl: 24,
    xs: 4,
  },

  // ==========================================================================
  // STYLE
  // ==========================================================================
  style: {
    borderWidth: 1,
    disabledOpacity: 0.5,
    hoverDarken: 0.05,
    hoverLighten: 0.075,
  },

  // ==========================================================================
  // TYPOGRAPHY
  // ==========================================================================
  typography: {
    fontFamily: {
      mono: "Noto Sans Mono",
      sans: "Noto Sans KR",
    },

    // Font sizes in pixels (aligned with Tailwind defaults)
    fontSize: {
      base: 16,
      lg: 18,
      sm: 14,
      xl: 20,
      xl2: 24,
      xl3: 30,
      xl4: 36,
      xl5: 48,
      xl6: 60,
      xl7: 72,
      xl8: 96,
      xs: 12,
    },

    fontWeight: {
      black: 900,
      bold: 700,
      medium: 500,
      regular: 400,
    },

    letterSpacing: {
      normal: 0,
      tight: -0.5,
      wide: 0.8,
    },

    // Line heights (relative multipliers)
    lineHeight: {
      base: 1.5,
      lg: 1.75,
      sm: 1.25,
      xl: 1.75,
      xl2: 2.0,
      xl3: 2.25,
      xl4: 2.5,
      xl5: 1.0,
      xl6: 1.0,
      xl7: 1.0,
      xl8: 1.0,
      xs: 1.0,
    },
  },
} as const;

export type ColorTokens = typeof tokens.color.light;
export type ColorKey = keyof ColorTokens;
