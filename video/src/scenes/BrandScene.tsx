import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { theme } from "../styles/theme";
import { GlowText } from "../components/GlowText";

// Deterministic particle positions
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  x: Math.sin(i * 1.8) * 400 + (i % 3) * 100,
  y: Math.cos(i * 2.1) * 300 + (i % 4) * 50,
  size: 2 + (i % 3) * 1.5,
  speed: 0.3 + (i % 5) * 0.15,
  delay: i * 3,
}));

export const BrandScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera: zoom in from wide
  const cameraScale = interpolate(frame, [0, 102], [0.9, 1.05], {
    extrapolateRight: "clamp",
  });

  // Logo: dramatic slam from 3x scale with bounce
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 80 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [3, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 0.2], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Tagline: blur-to-sharp reveal
  const taglineSpring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const taglineOpacity = interpolate(taglineSpring, [0, 1], [0, 1]);
  const taglineBlur = interpolate(taglineSpring, [0, 1], [10, 0]);
  const taglineY = interpolate(taglineSpring, [0, 1], [30, 0]);

  // Expanding glow rings on logo entrance
  const getRing = (delay: number, maxScale: number) => {
    const progress = interpolate(frame - delay, [0, 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      scale: interpolate(progress, [0, 1], [0.3, maxScale]),
      opacity: interpolate(progress, [0, 0.3, 1], [0, 0.4, 0]),
      show: frame >= delay,
    };
  };

  const ring1 = getRing(5, 4);
  const ring2 = getRing(12, 3);
  const ring3 = getRing(19, 2.5);

  // Background glow crescendo
  const bgGlow = interpolate(frame, [0, 80, 102], [0, 0.15, 0.25], {
    extrapolateRight: "clamp",
  });

  // Glow pulse
  const glowPulse = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.7, 1.3],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, ${theme.accent}30 0%, transparent 60%)`,
          opacity: bgGlow,
          transform: `scale(${glowPulse})`,
          pointerEvents: "none",
        }}
      />

      {/* Expanding glow rings */}
      {[ring1, ring2, ring3].map((ring, i) =>
        ring.show ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: `2px solid ${theme.accent}`,
              transform: `translate(-50%, -50%) scale(${ring.scale})`,
              opacity: ring.opacity,
              pointerEvents: "none",
              boxShadow: `0 0 20px ${theme.accent}40`,
            }}
          />
        ) : null,
      )}

      {/* Floating particles */}
      {PARTICLES.map((p, i) => {
        const pOpacity = interpolate(
          frame - p.delay,
          [0, 15, 80, 102],
          [0, 0.6, 0.6, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        const pY = p.y - frame * p.speed * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${pY}px)`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: theme.accentGlow,
              opacity: pOpacity,
              filter: `blur(${p.size > 3 ? 1 : 0}px)`,
              pointerEvents: "none",
            }}
          />
        );
      })}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          transform: `scale(${cameraScale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Logo: slam from 3x with bounce */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        >
          <GlowText text="NOD" fontSize={140} delay={5} />
        </div>

        {/* Tagline: blur-to-sharp */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: theme.textMuted,
            opacity: taglineOpacity,
            fontFamily: theme.fontFamily,
            filter: `blur(${taglineBlur}px)`,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: "0.02em",
          }}
        >
          Your AI-powered reading companion
        </div>
      </div>
    </AbsoluteFill>
  );
};
