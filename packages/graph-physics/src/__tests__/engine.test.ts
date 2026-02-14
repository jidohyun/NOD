import { describe, expect, it } from "vitest";

import type { GraphEdge, GraphNode } from "../types";
import { GraphEngine } from "../engine";

describe("GraphEngine", () => {
  it("updates velocity and position with damping applied", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        pos: { x: 10, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 4,
        pinned: false
      }
    ];

    const edges: GraphEdge[] = [];
    const engine = new GraphEngine(nodes, edges, {
      center: { x: 0, y: 0 },
      dt: 1,
      damping: 0.5,
      centerStrength: 1,
      repelStrength: 0,
      springStrength: 0,
      collisionStrength: 0,
      alpha: 1,
      alphaDecay: 1,
      alphaMin: 0
    });

    engine.tick();

    const updated = engine.getNodes()[0];
    expect(updated.vel.vx).toBeCloseTo(-5, 10);
    expect(updated.pos.x).toBeCloseTo(5, 10);
  });

  it("cools alpha down toward alphaMin", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        pos: { x: 0, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 4,
        pinned: false
      }
    ];

    const edges: GraphEdge[] = [];
    const engine = new GraphEngine(nodes, edges, {
      center: { x: 0, y: 0 },
      alpha: 1,
      alphaDecay: 0.5,
      alphaMin: 0.2,
      centerStrength: 0,
      repelStrength: 0,
      springStrength: 0,
      collisionStrength: 0
    });

    engine.tick();
    expect(engine.getAlpha()).toBeCloseTo(0.5, 10);

    engine.tick();
    expect(engine.getAlpha()).toBeCloseTo(0.25, 10);

    engine.tick();
    expect(engine.getAlpha()).toBeCloseTo(0.2, 10);
  });
});
