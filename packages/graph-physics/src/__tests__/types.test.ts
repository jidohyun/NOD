import { describe, expect, expectTypeOf, it } from "vitest";

import * as typesModule from "../index";
import {
  type GraphEdge,
  type GraphNode,
  type NodeId,
  type Position,
  type Velocity
} from "../index";

describe("graph-physics domain model", () => {
  it("enforces type intent for the minimal node and edge model", () => {
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

    expectTypeOf(node.id).toEqualTypeOf<NodeId>();
    expectTypeOf(node.pos).toEqualTypeOf<Position>();
    expectTypeOf(node.vel).toEqualTypeOf<Velocity>();
    expectTypeOf(nodeWithOptionalFields.mass).toEqualTypeOf<number | undefined>();
    expectTypeOf(edge.sourceId).toEqualTypeOf<NodeId>();
    expectTypeOf(edge.restLength).toEqualTypeOf<number>();
    expectTypeOf(weightedEdge.weight).toEqualTypeOf<number | undefined>();
  });

  it("exposes initializer runtime export", () => {
    expect(typesModule.createDeterministicRingSeeds).toBeTypeOf("function");
  });
});
