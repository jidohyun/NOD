import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Browser } from "../components/Browser";
import { theme } from "../styles/theme";

const ARTICLE_PREVIEW = {
  tag: "Architecture",
  title:
    "Why Microservices Architecture Is Reshaping Modern Web Development",
  author: "Sarah Chen",
  meta: "Feb 7, 2026 \u00b7 8 min read",
  lines: [
    "The shift from monolithic applications to microservices has fundamentally changed how engineering teams build and deploy software at scale.",
    "In a traditional monolith, a single codebase handles everything \u2014 from user authentication to payment processing to email notifications.",
  ],
};

const ICON_CENTER_X = 1116;
const ICON_CENTER_Y = 84;

export const ClickScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera: dramatic snap toward icon on click
  const CLICK_FRAME = 40;
  const preClickScale = interpolate(frame, [0, CLICK_FRAME], [1, 1.04], {
    extrapolateRight: "clamp",
  });
  const postClickScale = interpolate(
    frame,
    [CLICK_FRAME, CLICK_FRAME + 8, 102],
    [1.04, 1.15, 1.12],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cameraScale = frame < CLICK_FRAME ? preClickScale : postClickScale;

  const cameraPanX = interpolate(
    frame,
    [0, CLICK_FRAME, CLICK_FRAME + 10, 102],
    [0, -20, -60, -55],
    { extrapolateRight: "clamp" },
  );
  const cameraPanY = interpolate(
    frame,
    [0, CLICK_FRAME, CLICK_FRAME + 10, 102],
    [0, -10, -35, -30],
    { extrapolateRight: "clamp" },
  );

  // Icon entrance with dramatic bounce
  const iconScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 6, stiffness: 120 },
  });

  // Icon glow builds anticipation before click
  const iconGlow = interpolate(frame, [20, CLICK_FRAME], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor with eased cubic movement
  const cursorProgress = interpolate(frame, [14, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
  const cursorStartX = 300;
  const cursorStartY = 400;
  const cursorX = interpolate(
    cursorProgress,
    [0, 1],
    [cursorStartX, ICON_CENTER_X],
  );
  const cursorY = interpolate(
    cursorProgress,
    [0, 1],
    [cursorStartY, ICON_CENTER_Y],
  );

  // Click impact animations
  const clickFrame = frame - CLICK_FRAME;

  const iconClickScale = interpolate(
    clickFrame,
    [0, 3, 6, 12],
    [1, 1.5, 0.85, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Triple ripple burst
  const getRipple = (delay: number, maxScale: number) => ({
    scale: interpolate(clickFrame - delay, [0, 30], [0.5, maxScale], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    opacity: interpolate(clickFrame - delay, [0, 30], [0.8, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    show: clickFrame >= delay && clickFrame <= delay + 30,
  });

  const ripple1 = getRipple(0, 5);
  const ripple2 = getRipple(4, 4);
  const ripple3 = getRipple(8, 3.5);

  // Flash on click
  const flashOpacity = interpolate(clickFrame, [0, 3, 12], [0, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor press-down
  const cursorClickScale = interpolate(
    clickFrame,
    [-2, 0, 3, 6],
    [1, 0.7, 0.7, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Cursor glow trail
  const getTrailPos = (delay: number) => {
    const trailProgress = interpolate(frame - delay, [14, 34], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    return {
      x: interpolate(
        trailProgress,
        [0, 1],
        [cursorStartX, ICON_CENTER_X],
      ),
      y: interpolate(
        trailProgress,
        [0, 1],
        [cursorStartY, ICON_CENTER_Y],
      ),
      opacity: interpolate(frame, [14, 20, 34, 38], [0, 0.3, 0.3, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    };
  };
  const trail1 = getTrailPos(2);
  const trail2 = getTrailPos(4);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: theme.accent,
          opacity: flashOpacity,
          pointerEvents: "none",
          zIndex: 20,
        }}
      />

      <div
        style={{
          transform: `scale(${cameraScale}) translate(${cameraPanX}px, ${cameraPanY}px)`,
          transformOrigin: "center center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Browser url="techblog.dev/microservices-architecture-2026">
          {/* Dimmed blog content */}
          <div
            style={{
              padding: "48px 72px",
              opacity: 0.2,
              filter: "blur(2px)",
            }}
          >
            <span
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 12,
                fontWeight: 600,
                color: theme.accent,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {ARTICLE_PREVIEW.tag}
            </span>
            <h1
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 28,
                fontWeight: 700,
                color: theme.text,
                lineHeight: 1.3,
                margin: "12px 0 16px",
              }}
            >
              {ARTICLE_PREVIEW.title}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentGlow})`,
                }}
              />
              <span
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: 13,
                  color: theme.textMuted,
                }}
              >
                {ARTICLE_PREVIEW.author} &middot; {ARTICLE_PREVIEW.meta}
              </span>
            </div>
            {ARTICLE_PREVIEW.lines.map((line, i) => (
              <p
                key={i}
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: 14,
                  color: theme.textMuted,
                  lineHeight: 1.7,
                  margin: "0 0 12px",
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Extension icon with glow build-up */}
          <div
            style={{
              position: "absolute",
              top: 60,
              right: 60,
              width: 48,
              height: 48,
              backgroundColor: theme.surface,
              borderRadius: 12,
              border: `2px solid ${iconGlow > 0.5 ? theme.accent : theme.border}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${iconScale * iconClickScale})`,
              boxShadow: [
                `0 0 ${20 + iconGlow * 30}px rgba(232, 185, 49, ${0.2 + iconGlow * 0.5})`,
                clickFrame >= 0
                  ? `0 0 60px rgba(232, 185, 49, 0.8)`
                  : "",
              ]
                .filter(Boolean)
                .join(", "),
            }}
          >
            <span
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 24,
                fontWeight: 700,
                color: theme.accent,
              }}
            >
              N
            </span>
          </div>

          {/* Triple ripple burst */}
          {[ripple1, ripple2, ripple3].map((ripple, i) =>
            ripple.show ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: 60,
                  right: 60,
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: `${3 - i}px solid ${theme.accent}`,
                  transform: `scale(${ripple.scale})`,
                  opacity: ripple.opacity,
                  pointerEvents: "none",
                  boxShadow: `0 0 20px ${theme.accent}60`,
                }}
              />
            ) : null,
          )}

          {/* Cursor glow trails */}
          {[trail2, trail1].map((trail, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: trail.x,
                top: trail.y,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: theme.accent,
                opacity: trail.opacity * (1 - i * 0.3),
                filter: `blur(${2 + i}px)`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Mouse cursor */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            style={{
              position: "absolute",
              left: cursorX,
              top: cursorY,
              transform: `scale(${cursorClickScale})`,
              transformOrigin: "3px 3px",
              pointerEvents: "none",
              filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7))",
            }}
          >
            <path
              d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
              fill={theme.text}
              stroke={theme.bg}
              strokeWidth="1"
            />
          </svg>
        </Browser>
      </div>
    </AbsoluteFill>
  );
};
