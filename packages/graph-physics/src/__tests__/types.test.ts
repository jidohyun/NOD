import { describe, expect, it } from "vitest";

import {
  DEFAULT_GRAPH_PHYSICS_CONFIG,
  type ClusterConstraint,
  type GraphEdge,
  type GraphNode,
  type GraphPhysicsConfig
} from "../types";

describe("graph-physics domain model", () => {
  it("defines minimal domain-agnostic graph model types", () => {
    const node: GraphNode = {
      id: "node-1",
      x: 10,
      y: -5,
      mass: 1
    };

    const edge: GraphEdge = {
      id: "edge-1",
      source: "node-1",
      target: "node-2",
      strength: 0.5
    };

    const constraint: ClusterConstraint = {
      id: "cluster-a",
      nodeIds: ["node-1", "node-2"],
      radius: 120
    };

    const config: GraphPhysicsConfig = DEFAULT_GRAPH_PHYSICS_CONFIG;

    expect(node.id).toBe("node-1");
    expect(edge.source).toBe("node-1");
    expect(constraint.nodeIds).toHaveLength(2);
    expect(config.springStrength).toBeGreaterThan(0);
    expect(config.damping).toBeGreaterThan(0);
    expect(config.damping).toBeLessThan(1);
  });
});
