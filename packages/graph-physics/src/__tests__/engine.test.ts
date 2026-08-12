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

  it("keeps pinned nodes fixed at fx/fy and zero velocity during tick", () => {
    const nodes: GraphNode[] = [
      {
        id: "pinned",
        pos: { x: 100, y: 100 },
        vel: { vx: 5, vy: -5 },
        radius: 4,
        pinned: true,
        fx: 0,
        fy: 0
      },
      {
        id: "free",
        pos: { x: 10, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 4,
        pinned: false
      }
    ];

    const edges: GraphEdge[] = [
      {
        sourceId: "pinned",
        targetId: "free",
        restLength: 10,
        strength: 1
      }
    ];

    const engine = new GraphEngine(nodes, edges, {
      center: { x: 0, y: 0 },
      dt: 1,
      damping: 1,
      centerStrength: 0,
      repelStrength: 0,
      springStrength: 1,
      collisionStrength: 0,
      alpha: 1,
      alphaDecay: 1,
      alphaMin: 0
    });

    engine.tick();

    const [pinned, free] = engine.getNodes();
    expect(pinned.pos.x).toBe(0);
    expect(pinned.pos.y).toBe(0);
    expect(pinned.vel.vx).toBe(0);
    expect(pinned.vel.vy).toBe(0);
    expect(free.vel.vx).toBeCloseTo(0, 10);
    expect(free.vel.vy).toBeCloseTo(0, 10);
  });

  it("boosts local k-hop neighborhood influence during drag", () => {
    const nodes: GraphNode[] = [
      {
        id: "dragged",
        pos: { x: 0, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 4,
        pinned: false
      },
      {
        id: "local",
        pos: { x: 10, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 4,
        pinned: false
      },
      {
        id: "remote",
        pos: { x: 10, y: 0 },
        vel: { vx: 0, vy: 0 },
        radius: 4,
        pinned: false
      }
    ];

    const edges: GraphEdge[] = [
      {
        sourceId: "dragged",
        targetId: "local",
        restLength: 10,
        strength: 1
      }
    ];

    const engine = new GraphEngine(nodes, edges, {
      center: { x: 0, y: 0 },
      dt: 1,
      damping: 1,
      alpha: 1,
      alphaDecay: 1,
      alphaMin: 0,
      centerStrength: 1,
      repelStrength: 0,
      springStrength: 0,
      collisionStrength: 0,
      dragNeighborhoodHops: 1,
      localInfluenceBoost: 3
    });

    engine.onDragStart("dragged", { x: 0, y: 0 });
    engine.tick();

    const updated = engine.getNodes();
    const local = updated.find((node) => node.id === "local");
    const remote = updated.find((node) => node.id === "remote");

    expect(local).toBeDefined();
    expect(remote).toBeDefined();
    expect(Math.abs(local!.vel.vx)).toBeGreaterThan(Math.abs(remote!.vel.vx) * 2);
  });
});
