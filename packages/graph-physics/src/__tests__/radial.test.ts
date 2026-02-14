import { describe, expect, it } from "vitest";

import { GraphEngine } from "../engine";
import { applyRadialForce } from "../radial";
import type { GraphEdge, GraphNode } from "../types";

describe("applyRadialForce", () => {
  it("pushes outward when radius is below target", () => {
    const force = applyRadialForce(
      {
        id: "n1",
        pos: { x: 3, y: 4 }
      },
      { x: 0, y: 0 },
      { targetRadius: 10, strength: 2 }
    );

    expect(force.vx).toBeCloseTo(6, 10);
    expect(force.vy).toBeCloseTo(8, 10);
  });

  it("pulls inward when radius is above target", () => {
    const force = applyRadialForce(
      {
        id: "n1",
        pos: { x: 3, y: 4 }
      },
      { x: 0, y: 0 },
      { targetRadius: 2, strength: 1 }
    );

    expect(force.vx).toBeCloseTo(-1.8, 10);
    expect(force.vy).toBeCloseTo(-2.4, 10);
  });

  it("uses deterministic fallback direction at center", () => {
    const force = applyRadialForce(
      {
        id: "n1",
        pos: { x: 0, y: 0 }
      },
      { x: 0, y: 0 },
      { targetRadius: 10, strength: 0.5 }
    );

    expect(force.vx).toBeCloseTo(5, 10);
    expect(force.vy).toBeCloseTo(0, 10);
  });
});

describe("GraphEngine radial constraint", () => {
  it("applies radial force when enabled", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        pos: { x: 1, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 2,
        pinned: false
      }
    ];

    const engine = new GraphEngine(nodes, [], {
      center: { x: 0, y: 0 },
      dt: 1,
      damping: 1,
      alpha: 1,
      alphaDecay: 1,
      alphaMin: 0,
      centerStrength: 0,
      repelStrength: 0,
      springStrength: 0,
      collisionStrength: 0,
      radialEnabled: true,
      radialStrength: 1,
      radialTargetRadius: 3
    });

    engine.tick();

    const [updated] = engine.getNodes();
    expect(updated.vel.vx).toBeCloseTo(2, 10);
    expect(updated.pos.x).toBeCloseTo(3, 10);
  });

  it("keeps prior behavior when radial is disabled", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        pos: { x: 1, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 2,
        pinned: false
      }
    ];
    const edges: GraphEdge[] = [];

    const engine = new GraphEngine(nodes, edges, {
      center: { x: 0, y: 0 },
      dt: 1,
      damping: 1,
      alpha: 1,
      alphaDecay: 1,
      alphaMin: 0,
      centerStrength: 0,
      repelStrength: 0,
      springStrength: 0,
      collisionStrength: 0
    });

    engine.tick();

    const [updated] = engine.getNodes();
    expect(updated.vel.vx).toBe(0);
    expect(updated.vel.vy).toBe(0);
    expect(updated.pos.x).toBe(1);
    expect(updated.pos.y).toBe(0);
  });
});
