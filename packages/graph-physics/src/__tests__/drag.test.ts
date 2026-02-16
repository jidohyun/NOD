import { describe, expect, it } from "vitest";

import type { GraphEdge, GraphNode } from "../types";
import {
  DRAG_HOLD_ALPHA,
  DRAG_RELEASE_ALPHA,
  DRAG_REHEAT_ALPHA
} from "../drag";
import { GraphEngine } from "../engine";

describe("GraphEngine drag lifecycle", () => {
  it("pins node and reheats alpha on drag start", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        pos: { x: 1, y: 2 },
        vel: { vx: 3, vy: 4 },
        radius: 4,
        pinned: false
      }
    ];
    const edges: GraphEdge[] = [];

    const engine = new GraphEngine(nodes, edges, {
      center: { x: 0, y: 0 },
      alpha: 0.05,
      alphaDecay: 1,
      alphaMin: 0,
      centerStrength: 0,
      repelStrength: 0,
      springStrength: 0,
      collisionStrength: 0
    });

    engine.onDragStart("n1", { x: 20, y: 30 });

    const [node] = engine.getNodes();
    expect(node.pinned).toBe(true);
    expect(node.fx).toBe(20);
    expect(node.fy).toBe(30);
    expect(node.vel.vx).toBe(0);
    expect(node.vel.vy).toBe(0);
    expect(engine.getAlpha()).toBe(DRAG_REHEAT_ALPHA);
  });

  it("updates pin target and holds alpha on drag move", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        pos: { x: 0, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 4,
        pinned: false
      }
    ];

    const engine = new GraphEngine(nodes, [], {
      center: { x: 0, y: 0 },
      alpha: 0,
      alphaDecay: 1,
      alphaMin: 0,
      centerStrength: 0,
      repelStrength: 0,
      springStrength: 0,
      collisionStrength: 0
    });

    engine.onDragStart("n1", { x: 10, y: 10 });
    engine.onDragMove("n1", { x: 15, y: -5 });

    const [node] = engine.getNodes();
    expect(node.fx).toBe(15);
    expect(node.fy).toBe(-5);
    expect(engine.getAlpha()).toBe(DRAG_HOLD_ALPHA);
  });

  it("unpins on drag end and cools alpha toward zero", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        pos: { x: 0, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 4,
        pinned: false
      }
    ];

    const engine = new GraphEngine(nodes, [], {
      center: { x: 0, y: 0 },
      alpha: 0,
      alphaDecay: 1,
      alphaMin: 0,
      centerStrength: 0,
      repelStrength: 0,
      springStrength: 0,
      collisionStrength: 0
    });

    engine.onDragStart("n1", { x: 10, y: 10 });
    engine.onDragMove("n1", { x: 20, y: 20 });
    engine.onDragEnd("n1");

    const [afterEnd] = engine.getNodes();
    expect(afterEnd.pinned).toBe(false);
    expect(afterEnd.fx).toBeUndefined();
    expect(afterEnd.fy).toBeUndefined();
    expect(engine.getAlpha()).toBe(DRAG_RELEASE_ALPHA);

    engine.tick();
    expect(engine.getAlpha()).toBeLessThan(DRAG_RELEASE_ALPHA);
  });
});
