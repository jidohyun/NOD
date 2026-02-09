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

const ARTICLE_TITLE =
  "Why Microservices Architecture Is Reshaping Modern Web Development";

const ARTICLE_PARAGRAPHS = [
  "The shift from monolithic applications to microservices has fundamentally changed how engineering teams build and deploy software at scale.",
  "In a traditional monolith, a single codebase handles everything \u2014 from user authentication to payment processing to email notifications. As the application grows, this tight coupling becomes a bottleneck.",
  "Microservices decompose functionality into small, independent services that communicate via APIs. Each service owns its data, scales independently, and can be deployed without affecting others.",
  "Companies like Netflix, Uber, and Spotify have demonstrated the power of this approach. Netflix runs over 700 microservices in production, enabling teams to deploy thousands of times per day.",
];

const META_INFO = {
  author: "Sarah Chen",
  date: "Feb 7, 2026",
  readTime: "8 min read",
  tag: "Architecture",
};

export const ArticleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dramatic camera: big zoom + pan
  const cameraScale = interpolate(frame, [0, 102], [1, 1.18], {
    extrapolateRight: "clamp",
  });
  const cameraPanY = interpolate(frame, [0, 102], [0, -50], {
    extrapolateRight: "clamp",
  });

  // Browser 3D entrance: scale from 0.7 with perspective rotation
  const browserEntrance = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const browserScale = interpolate(browserEntrance, [0, 1], [0.7, 1]);
  const browserRotateX = interpolate(browserEntrance, [0, 1], [15, 0]);
  const browserOpacity = interpolate(browserEntrance, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scrollProgress = interpolate(frame, [20, 90], [0, 80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Accent light sweep across browser
  const sweepX = interpolate(frame, [15, 55], [-100, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const getEntrance = (delay: number) => {
    const s = spring({
      frame: frame - delay,
      fps,
      config: { damping: 12, stiffness: 120 },
    });
    return {
      opacity: interpolate(s, [0, 1], [0, 1]),
      transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
    };
  };

  // Vignette
  const vignetteOpacity = interpolate(frame, [0, 30], [0.6, 0.3], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)",
          opacity: vignetteOpacity,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${cameraScale}) translateY(${cameraPanY}px)`,
          transformOrigin: "center center",
          perspective: 1200,
        }}
      >
        <div
          style={{
            transform: `scale(${browserScale}) rotateX(${browserRotateX}deg)`,
            opacity: browserOpacity,
            transformOrigin: "center bottom",
          }}
        >
          <Browser url="techblog.dev/microservices-architecture-2026">
            <div
              style={{
                padding: "48px 72px",
                backgroundColor: theme.surface,
                position: "relative",
                height: 580,
                overflow: "hidden",
              }}
            >
              {/* Accent sweep line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${sweepX}%`,
                  width: 2,
                  height: "100%",
                  background: `linear-gradient(180deg, transparent, ${theme.accent}, transparent)`,
                  opacity: 0.6,
                  pointerEvents: "none",
                  filter: "blur(1px)",
                  boxShadow: `0 0 20px ${theme.accent}60`,
                }}
              />

              <div
                style={{
                  transform: `translateY(-${scrollProgress}px)`,
                }}
              >
                {/* Tag */}
                <div style={{ ...getEntrance(0), marginBottom: 16 }}>
                  <span
                    style={{
                      fontFamily: theme.fontFamily,
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.accent,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      backgroundColor: `${theme.accent}15`,
                      padding: "4px 10px",
                      borderRadius: 4,
                    }}
                  >
                    {META_INFO.tag}
                  </span>
                </div>

                {/* Title */}
                <div style={{ ...getEntrance(3), marginBottom: 20 }}>
                  <h1
                    style={{
                      fontFamily: theme.fontFamily,
                      fontSize: 32,
                      fontWeight: 700,
                      color: theme.text,
                      lineHeight: 1.3,
                      margin: 0,
                    }}
                  >
                    {ARTICLE_TITLE}
                  </h1>
                </div>

                {/* Author / Meta */}
                <div
                  style={{
                    ...getEntrance(6),
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 32,
                    paddingBottom: 24,
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentGlow})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.fontFamily,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#fff",
                      }}
                    >
                      SC
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.fontFamily,
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.text,
                      }}
                    >
                      {META_INFO.author}
                    </span>
                    <span
                      style={{
                        fontFamily: theme.fontFamily,
                        fontSize: 12,
                        color: theme.textMuted,
                      }}
                    >
                      {META_INFO.date} &middot; {META_INFO.readTime}
                    </span>
                  </div>
                </div>

                {/* Paragraphs */}
                {ARTICLE_PARAGRAPHS.map((text, index) => (
                  <div
                    key={index}
                    style={{
                      ...getEntrance(8 + index * 3),
                      marginBottom: 20,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: theme.fontFamily,
                        fontSize: 15,
                        color: theme.textMuted,
                        lineHeight: 1.8,
                        margin: 0,
                      }}
                    >
                      {text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Scroll indicator with glow */}
              <div
                style={{
                  position: "absolute",
                  right: 16,
                  top: 48,
                  width: 4,
                  height: 100,
                  backgroundColor: theme.border,
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 36,
                    backgroundColor: theme.accent,
                    borderRadius: 2,
                    boxShadow: `0 0 8px ${theme.accent}`,
                    transform: `translateY(${interpolate(frame, [20, 90], [0, 64], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                  }}
                />
              </div>
            </div>
          </Browser>
        </div>
      </div>
    </AbsoluteFill>
  );
};
