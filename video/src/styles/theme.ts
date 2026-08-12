import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const theme = {
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceLight: "#1e1e1e",
  border: "#2a2a2a",
  text: "#ffffff",
  textMuted: "#a0a0a0",
  textDim: "#666666",
  accent: "#E8B931",
  accentGlow: "#F2D660",
  accentDim: "#C49A1A",
  success: "#22c55e",
  fontFamily,
} as const;

export const FPS = 30;
export const SCENE_DURATION = 3 * FPS; // 90 frames per scene
export const TRANSITION_DURATION = 15; // 15 frame overlap
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Total: 5 scenes * 90 frames - 4 transitions * 15 frames = 450 - 60 = 390
// But we want 450 total, so each scene = 102 frames to compensate
// Actually: 5 * SCENE_DURATION - 4 * TRANSITION = 450
// 5 * S - 4 * 15 = 450 => 5S = 510 => S = 102
export const ADJUSTED_SCENE_DURATION = 102;
export const TOTAL_FRAMES = 450;
