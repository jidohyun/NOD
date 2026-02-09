import React from "react";
import {
  AbsoluteFill,
  Easing,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { theme } from "../styles/theme";

const ARTICLE_CARDS = [
  {
    title: "Microservices Architecture",
    concepts: "API Gateway, Service Mesh",
    date: "Feb 7",
  },
  {
    title: "React Server Components",
    concepts: "RSC, Streaming SSR",
    date: "Feb 5",
  },
  {
    title: "Database Sharding Patterns",
    concepts: "Horizontal Scaling, Partition",
    date: "Feb 3",
  },
  {
    title: "OAuth 2.0 Best Practices",
    concepts: "PKCE, Token Rotation",
    date: "Feb 1",
  },
  {
    title: "Event-Driven Architecture",
    concepts: "CQRS, Event Sourcing",
    date: "Jan 30",
  },
  {
    title: "WebAssembly in Production",
    concepts: "WASM, Edge Computing",
    date: "Jan 28",
  },
  {
    title: "GraphQL Federation",
    concepts: "Schema Stitching, Subgraphs",
    date: "Jan 26",
  },
  {
    title: "Zero-Trust Security Model",
    concepts: "mTLS, Identity Proxy",
    date: "Jan 24",
  },
];

const CENTER_CARD = {
  title: "Microservices vs Monolith Architecture",
  summary:
    "Microservices enable independent deployment and scaling. Key patterns include service mesh, API gateway, and event-driven communication.",
  concepts: ["Microservices", "API Gateway", "Service Mesh"],
};

export const KnowledgeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dramatic zoom out with easing
  const cameraScale = interpolate(frame, [0, 102], [1.25, 0.95], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const cameraPanY = interpolate(frame, [0, 102], [30, -15], {
    extrapolateRight: "clamp",
  });

  // Center card shrinks dramatically
  const centerCardSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const centerCardScale = interpolate(
    centerCardSpring,
    [0, 1],
    [1.2, 0.55],
  );
  const centerCardOpacity = interpolate(frame, [0, 60], [1, 0.9], {
    extrapolateRight: "clamp",
  });

  // Grid positions with rotation angles for burst effect
  const gridPositions = [
    { x: -280, y: -200, angle: -15 },
    { x: 0, y: -200, angle: 0 },
    { x: 280, y: -200, angle: 15 },
    { x: -280, y: 0, angle: -5 },
    { x: 280, y: 0, angle: 5 },
    { x: -280, y: 200, angle: -10 },
    { x: 0, y: 200, angle: 0 },
    { x: 280, y: 200, angle: 10 },
  ];

  // Counter with dramatic spring bounce
  const counterSpring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 8, stiffness: 100 },
  });
  const counterScale = interpolate(counterSpring, [0, 1], [0, 1]);
  const counterValue = interpolate(
    frame,
    [40, 55, 85, 102],
    [12, 47, 156, 156],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const counterOpacity = interpolate(frame, [40, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Central glow burst
  const glowScale = interpolate(frame, [0, 102], [0.5, 2.5], {
    extrapolateRight: "clamp",
  });
  const glowOpacity = interpolate(frame, [0, 102], [0, 0.25], {
    extrapolateRight: "clamp",
  });

  // Rotating light rays
  const rayRotation = interpolate(frame, [0, 102], [0, 15], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${cameraScale}) translateY(${cameraPanY}px)`,
          transformOrigin: "center center",
          position: "relative",
        }}
      >
        {/* Light rays from center */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 800,
            height: 800,
            transform: `translate(-50%, -50%) rotate(${rayRotation}deg)`,
            background: `conic-gradient(from 0deg, transparent, ${theme.accent}08, transparent, ${theme.accent}08, transparent, ${theme.accent}08, transparent, ${theme.accent}08, transparent)`,
            opacity: glowOpacity * 2,
            pointerEvents: "none",
          }}
        />

        {/* Radial glow burst */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at center, ${theme.accent}30 0%, transparent 60%)`,
            opacity: glowOpacity,
            transform: `scale(${glowScale})`,
            pointerEvents: "none",
          }}
        />

        {/* Grid cards - burst outward from center */}
        {gridPositions.map((pos, i) => {
          const card = ARTICLE_CARDS[i];
          const cardDelay = 12 + i * 4;

          const cardSpring = spring({
            frame: frame - cardDelay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          const cardX = interpolate(cardSpring, [0, 1], [0, pos.x]);
          const cardY = interpolate(cardSpring, [0, 1], [0, pos.y]);
          const cardScale = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardRotate = interpolate(
            cardSpring,
            [0, 1],
            [pos.angle * 2, pos.angle * 0.3],
          );
          const cardOpacity = interpolate(cardSpring, [0, 0.2], [0, 1], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 190,
                height: 115,
                transform: `translate(calc(-50% + ${cardX}px), calc(-50% + ${cardY}px)) scale(${cardScale}) rotate(${cardRotate}deg)`,
                backgroundColor: theme.surface,
                borderLeft: `3px solid ${theme.accent}`,
                borderRadius: 10,
                padding: "10px 14px",
                opacity: cardOpacity,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 1px ${theme.accent}30`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: theme.fontFamily,
                    fontSize: 11,
                    fontWeight: 600,
                    color: theme.text,
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontFamily: theme.fontFamily,
                    fontSize: 9,
                    color: theme.textDim,
                    lineHeight: 1.3,
                  }}
                >
                  {card.concepts}
                </div>
              </div>
              <div
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: 9,
                  color: theme.textDim,
                }}
              >
                {card.date}
              </div>
            </div>
          );
        })}

        {/* Center summary card */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 320,
            height: 200,
            transform: `translate(-50%, -50%) scale(${centerCardScale})`,
            backgroundColor: theme.surface,
            borderLeft: `4px solid ${theme.accent}`,
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: `0 8px 40px ${theme.accent}50, 0 0 80px ${theme.accent}20`,
            opacity: centerCardOpacity,
          }}
        >
          <div
            style={{
              fontFamily: theme.fontFamily,
              fontSize: 15,
              fontWeight: 600,
              color: theme.text,
              lineHeight: 1.3,
            }}
          >
            {CENTER_CARD.title}
          </div>
          <div
            style={{
              fontFamily: theme.fontFamily,
              fontSize: 12,
              color: theme.textMuted,
              lineHeight: 1.5,
            }}
          >
            {CENTER_CARD.summary}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 4,
            }}
          >
            {CENTER_CARD.concepts.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: 10,
                  fontWeight: 500,
                  color: theme.accentGlow,
                  backgroundColor: `${theme.accent}20`,
                  padding: "2px 8px",
                  borderRadius: 8,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Counter with dramatic spring entrance */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: "50%",
            transform: `translateX(-50%) scale(${counterScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: counterOpacity,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: theme.text,
              fontFamily: theme.fontFamily,
              lineHeight: 1,
              textShadow: `0 0 30px ${theme.accent}60`,
            }}
          >
            {Math.floor(counterValue)}
          </div>
          <div
            style={{
              fontSize: 16,
              color: theme.textMuted,
              fontFamily: theme.fontFamily,
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            articles saved
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
