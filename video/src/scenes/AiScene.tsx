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

// Split into left/right columns explicitly to fill the full screen height
const ARTICLE_LEFT = [
  "The shift from monolithic applications to microservices has fundamentally changed how engineering teams build and deploy software at scale. Organizations that once relied on tightly coupled monolithic codebases are now decomposing their systems into independently deployable services.",
  "In a traditional monolith, a single codebase handles everything \u2014 from user authentication to payment processing to email notifications. As the application grows, this tight coupling becomes a bottleneck. Deploying a minor change requires rebuilding and redeploying the entire application.",
  "Microservices decompose functionality into small, independent services that communicate via APIs. Each service owns its data, scales independently, and can be deployed without affecting others. This architectural style promotes team autonomy and fault isolation.",
  "The API Gateway pattern serves as a single entry point for all client requests. It handles cross-cutting concerns such as authentication, rate limiting, request routing, and response aggregation. Popular implementations include Kong, AWS API Gateway, and Envoy Proxy.",
  "Service mesh technologies like Istio and Linkerd provide a dedicated infrastructure layer for service-to-service communication. They handle load balancing, encryption (mTLS), observability, and circuit breaking without requiring changes to application code.",
  "Event-driven communication patterns decouple services temporally and spatially. Instead of synchronous HTTP calls, services emit events to message brokers like Apache Kafka or RabbitMQ. Consumers process events asynchronously, enabling greater resilience and scalability.",
  "Companies like Netflix, Uber, and Spotify have demonstrated the power of this approach at massive scale. Netflix runs over 700 microservices in production, enabling teams to deploy thousands of times per day. Their Zuul gateway handles billions of requests daily.",
  "Container orchestration with Kubernetes has become the de facto standard for deploying microservices. Kubernetes manages container scheduling, service discovery, rolling deployments, and auto-scaling across hundreds of nodes.",
  "CI/CD pipelines automate the build, test, and deployment lifecycle for each microservice independently. Tools like GitHub Actions, GitLab CI, and ArgoCD enable trunk-based development with canary deployments and automated rollbacks.",
  "gRPC has emerged as a preferred protocol for inter-service communication due to its binary serialization, bidirectional streaming, and automatic code generation from Protocol Buffer definitions. Combined with service mesh, it provides type-safe, high-performance RPC across polyglot services.",
];

const ARTICLE_RIGHT = [
  "However, microservices introduce significant operational complexity. Distributed tracing with tools like Jaeger or Zipkin becomes essential for debugging request flows across service boundaries. Centralized logging via ELK Stack or Datadog aggregates logs from hundreds of containers.",
  "Database management in a microservices architecture follows the database-per-service pattern. Each service owns its data store \u2014 PostgreSQL for relational data, MongoDB for documents, Redis for caching, Elasticsearch for search. Data consistency is achieved through saga patterns and eventual consistency.",
  "Observability is a critical pillar of microservices operations. The three pillars \u2014 metrics, logs, and traces \u2014 provide comprehensive visibility into system behavior. Prometheus collects time-series metrics, Grafana visualizes dashboards, and alerting rules notify engineers of anomalies.",
  "Security in a microservices environment requires a zero-trust approach. Every service-to-service call must be authenticated and authorized. OAuth 2.0 handles external authentication, while mTLS secures internal communication. Secret management solutions like HashiCorp Vault rotate credentials automatically.",
  "Resilience patterns such as circuit breakers, bulkheads, and retry policies prevent cascade failures across service boundaries. Libraries like Resilience4j and Polly implement these patterns, while service meshes can enforce them transparently at the infrastructure layer.",
  "Testing strategies for microservices differ fundamentally from monolithic approaches. Contract testing with Pact ensures API compatibility between services. Consumer-driven contracts validate that producers satisfy consumer expectations without requiring end-to-end integration tests.",
  "Infrastructure as Code tools like Terraform and Pulumi provision cloud resources declaratively. Each microservice defines its infrastructure requirements \u2014 databases, queues, storage buckets \u2014 alongside application code, enabling self-service deployment and environment parity.",
  "Domain-Driven Design (DDD) provides the strategic framework for decomposing monoliths into microservices. Bounded contexts define clear service boundaries, while anti-corruption layers translate between different domain models at integration points.",
  "Feature flags enable progressive rollouts and A/B testing at the service level. LaunchDarkly and Unleash provide centralized flag management, allowing teams to decouple deployment from release and safely test new functionality with a subset of production traffic.",
  "Cost optimization in microservices requires careful resource allocation. Right-sizing container CPU and memory limits, implementing request-based autoscaling with KEDA, and leveraging spot instances for non-critical workloads can reduce cloud spend by 40-60% without sacrificing reliability.",
];

const ARTICLE_TAG = "Architecture";
const ARTICLE_TITLE =
  "Why Microservices Architecture Is Reshaping Modern Web Development";

const SUMMARY_TITLE = "Microservices vs Monolith Architecture";

const SUMMARY_BULLETS = [
  "Microservices enable independent deployment and scaling of services",
  "Key concepts: service mesh, API gateway, event-driven communication",
  "Related to 12 saved articles on distributed systems",
];

const KEY_CONCEPTS = ["Microservices", "API Gateway", "Service Mesh"];

export const AiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dramatic camera drift
  const cameraPanX = interpolate(frame, [0, 102], [40, -40], {
    extrapolateRight: "clamp",
  });
  const cameraScale = interpolate(frame, [0, 102], [1.05, 0.98], {
    extrapolateRight: "clamp",
  });

  // Panel slam-in with overshoot bounce
  const panelSpring = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 120 },
  });
  const panelX = interpolate(panelSpring, [0, 1], [600, 0]);

  // Panel left border glow
  const panelGlow = interpolate(panelSpring, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scanning line sweeps across article
  const scanLineY = interpolate(frame, [5, 50], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanLineOpacity = interpolate(frame, [5, 45, 50], [0.8, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Article progressively dims
  const articleOpacity = interpolate(frame, [0, 40], [0.5, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slow scroll to reveal the massive wall of text
  const articleScrollY = interpolate(frame, [0, 102], [0, 500], {
    extrapolateRight: "clamp",
  });

  // Fast typewriter
  const analyzeText = "Analyzing article content...";
  const typewriterProgress = interpolate(
    frame,
    [8, 28],
    [0, analyzeText.length],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const displayText = analyzeText.slice(0, Math.floor(typewriterProgress));

  // Bullets slide in from right with spring
  const getBulletAnim = (index: number) => {
    const startFrame = 38 + index * 6;
    const s = spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 12, stiffness: 100 },
    });
    return {
      opacity: interpolate(s, [0, 1], [0, 1]),
      translateX: interpolate(s, [0, 1], [60, 0]),
    };
  };

  // Summary title spring entrance
  const summaryTitleSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const summaryTitleOpacity = interpolate(
    summaryTitleSpring,
    [0, 1],
    [0, 1],
  );
  const summaryTitleY = interpolate(summaryTitleSpring, [0, 1], [20, 0]);

  // Concept tags scale in with bounce
  const getConceptAnim = (index: number) => {
    const startFrame = 65 + index * 5;
    const s = spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 8, stiffness: 120 },
    });
    return {
      opacity: interpolate(s, [0, 0.3], [0, 1], {
        extrapolateRight: "clamp",
      }),
      scale: interpolate(s, [0, 1], [0, 1]),
    };
  };

  // Progress bar with eased fill
  const progressWidth = interpolate(frame, [45, 90], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Header icon spin on entrance
  const headerIconSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 60 },
  });
  const iconRotate = interpolate(headerIconSpring, [0, 1], [180, 0]);

  // Panel glow hex value
  const panelGlowHex = Math.round(panelGlow * 20)
    .toString(16)
    .padStart(2, "0");

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${cameraScale}) translateX(${cameraPanX}px)`,
          transformOrigin: "center center",
          position: "relative",
        }}
      >
        {/* Full-width article wall — massive text behind panel */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            opacity: articleOpacity,
          }}
        >
          {/* Scanning line effect */}
          <div
            style={{
              position: "absolute",
              left: 40,
              right: 40,
              top: `${scanLineY}%`,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
              opacity: scanLineOpacity,
              boxShadow: `0 0 20px ${theme.accent}, 0 0 40px ${theme.accent}40`,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* Scrolling text body — 2-column flex, large font to fill screen */}
          <div
            style={{
              transform: `translateY(-${articleScrollY}px)`,
              padding: "36px 48px",
            }}
          >
            <span
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 14,
                fontWeight: 600,
                color: theme.accent,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {ARTICLE_TAG}
            </span>
            <h1
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 32,
                fontWeight: 700,
                color: theme.text,
                lineHeight: 1.3,
                margin: "10px 0 24px",
              }}
            >
              {ARTICLE_TITLE}
            </h1>
            <div
              style={{
                display: "flex",
                gap: 48,
              }}
            >
              {/* Left column */}
              <div style={{ flex: 1 }}>
                {ARTICLE_LEFT.map((text, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: theme.fontFamily,
                      fontSize: 16,
                      color: theme.textMuted,
                      lineHeight: 1.7,
                      margin: "0 0 16px",
                    }}
                  >
                    {text}
                  </p>
                ))}
              </div>
              {/* Right column */}
              <div style={{ flex: 1 }}>
                {ARTICLE_RIGHT.map((text, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: theme.fontFamily,
                      fontSize: 16,
                      color: theme.textMuted,
                      lineHeight: 1.7,
                      margin: "0 0 16px",
                    }}
                  >
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Top/bottom fade masks */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 60,
              background: `linear-gradient(180deg, ${theme.bg}, transparent)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background: `linear-gradient(0deg, ${theme.bg}, transparent)`,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Right panel - slam in */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 520,
            height: "100%",
            backgroundColor: theme.surface,
            borderLeft: `1px solid ${theme.accent}40`,
            transform: `translateX(${panelX}px)`,
            display: "flex",
            flexDirection: "column",
            padding: 40,
            boxShadow: `-20px 0 60px rgba(0,0,0,0.5), -4px 0 20px ${theme.accent}${panelGlowHex}`,
          }}
        >
          {/* Header with spinning icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentGlow})`,
                marginRight: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `rotate(${iconRotate}deg)`,
                boxShadow: `0 0 20px ${theme.accent}60`,
              }}
            >
              <span
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                N
              </span>
            </div>
            <span
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 18,
                fontWeight: 600,
                color: theme.text,
              }}
            >
              NOD Summary
            </span>
          </div>

          {/* Typewriter with glowing cursor */}
          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 13,
                color: theme.textMuted,
              }}
            >
              {displayText}
              {frame < 28 && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 14,
                    backgroundColor: theme.accent,
                    marginLeft: 2,
                    opacity: Math.floor(frame / 6) % 2 === 0 ? 1 : 0,
                    boxShadow: `0 0 4px ${theme.accent}`,
                  }}
                />
              )}
            </span>
          </div>

          {/* Summary title with spring */}
          <div
            style={{
              opacity: summaryTitleOpacity,
              transform: `translateY(${summaryTitleY}px)`,
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 17,
                fontWeight: 600,
                color: theme.text,
                margin: 0,
              }}
            >
              {SUMMARY_TITLE}
            </h3>
          </div>

          {/* Bullet points - slide from right */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {SUMMARY_BULLETS.map((bullet, index) => {
              const anim = getBulletAnim(index);
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    opacity: anim.opacity,
                    transform: `translateX(${anim.translateX}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: theme.accent,
                      marginRight: 12,
                      marginTop: 7,
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${theme.accent}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: theme.fontFamily,
                      fontSize: 14,
                      color: theme.text,
                      lineHeight: 1.5,
                    }}
                  >
                    {bullet}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Key concepts - scale in with bounce */}
          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                fontFamily: theme.fontFamily,
                fontSize: 11,
                fontWeight: 600,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 10,
                display: "block",
                opacity: getConceptAnim(0).opacity,
              }}
            >
              Key Concepts
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {KEY_CONCEPTS.map((concept, i) => {
                const anim = getConceptAnim(i);
                return (
                  <span
                    key={i}
                    style={{
                      fontFamily: theme.fontFamily,
                      fontSize: 12,
                      fontWeight: 500,
                      color: theme.accentGlow,
                      backgroundColor: `${theme.accent}20`,
                      padding: "5px 14px",
                      borderRadius: 12,
                      opacity: anim.opacity,
                      transform: `scale(${anim.scale})`,
                      border: `1px solid ${theme.accent}30`,
                    }}
                  >
                    {concept}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Progress bar with glow */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: 11,
                  color: theme.textDim,
                }}
              >
                Processing
              </span>
              <span
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: 11,
                  color: theme.accent,
                  fontWeight: 600,
                }}
              >
                {Math.floor(progressWidth)}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 4,
                backgroundColor: theme.surfaceLight,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressWidth}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accentGlow} 100%)`,
                  borderRadius: 2,
                  boxShadow: `0 0 10px ${theme.accent}, 0 0 20px ${theme.accent}40`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
