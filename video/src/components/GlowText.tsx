import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../styles/theme";

type GlowTextProps = {
  text: string;
  fontSize?: number;
  delay?: number;
  color?: string;
  glowColor?: string;
};

export const GlowText: React.FC<GlowTextProps> = ({
  text,
  fontSize = 72,
  delay = 0,
  color = theme.text,
  glowColor = theme.accentGlow,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dramatic slam entrance: scale from 0 with overshoot
  const entrance = spring({
    frame,
    fps,
    delay,
    config: { damping: 8, stiffness: 100 },
  });

  const scale = interpolate(entrance, [0, 1], [0, 1]);
  const opacity = interpolate(entrance, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Letter spacing tightens during entrance
  const letterSpacing = interpolate(entrance, [0, 1], [0.3, -0.02]);

  // Glow builds up and pulses after entrance
  const baseGlow = interpolate(entrance, [0, 1], [0, 40]);
  const glowPulse =
    entrance >= 0.9
      ? interpolate(Math.sin((frame - delay) * 0.08), [-1, 1], [0.7, 1.3])
      : 1;
  const glowIntensity = baseGlow * glowPulse;

  return (
    <div
      style={{
        fontSize,
        fontFamily: theme.fontFamily,
        fontWeight: 700,
        color,
        opacity,
        transform: `scale(${scale})`,
        textShadow: [
          `0 0 ${glowIntensity}px ${glowColor}`,
          `0 0 ${glowIntensity * 2}px ${glowColor}`,
          `0 0 ${glowIntensity * 4}px ${glowColor}40`,
          `0 0 ${glowIntensity * 6}px ${glowColor}20`,
        ].join(", "),
        letterSpacing: `${letterSpacing}em`,
      }}
    >
      {text}
    </div>
  );
};
