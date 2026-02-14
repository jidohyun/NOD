import { describe, expect, it } from "vitest";

import * as typesModule from "../types";
import {
  type GraphEdge,
  type GraphNode
} from "../types";

describe("graph-physics domain model", () => {
  it("defines minimal node and edge fields from spec", () => {
    const node: GraphNode = {
      id: "node-1",
      pos: { x: 10, y: -5 },
      vel: { vx: 1, vy: -1 },
      radius: 12,
      pinned: false
    };

    const nodeWithOptionalFields: GraphNode = {
      id: "node-2",
      pos: { x: 0, y: 0 },
      vel: { vx: 0, vy: 0 },
      radius: 8,
      pinned: true,
      mass: 2,
      charge: -3,
      fx: 100,
      fy: 200
    };

    const edge: GraphEdge = {
      sourceId: "node-1",
      targetId: "node-2",
      restLength: 120,
      strength: 0.5
    };

    const weightedEdge: GraphEdge = {
      sourceId: "node-2",
      targetId: "node-3",
      restLength: 80,
      strength: 0.7,
      weight: 2
    };

    expect(node.id).toBe("node-1");
    expect(node.pos.x).toBe(10);
    expect(node.vel.vy).toBe(-1);
    expect(nodeWithOptionalFields.fx).toBe(100);
    expect(nodeWithOptionalFields.charge).toBe(-3);
    expect(edge.sourceId).toBe("node-1");
    expect(edge.restLength).toBe(120);
    expect(weightedEdge.weight).toBe(2);
  });

  it("exposes only minimal task-1 runtime surface", () => {
    expect("DEFAULT_GRAPH_PHYSICS_CONFIG" in typesModule).toBe(false);
  });
});
