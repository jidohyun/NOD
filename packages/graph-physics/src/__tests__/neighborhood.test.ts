import { describe, expect, it } from "vitest";

import type { GraphEdge } from "../types";
import { getKHopNeighborhood } from "../neighborhood";

describe("getKHopNeighborhood", () => {
  const edges: GraphEdge[] = [
    { sourceId: "a", targetId: "b", restLength: 10, strength: 1 },
    { sourceId: "b", targetId: "c", restLength: 10, strength: 1 },
    { sourceId: "c", targetId: "d", restLength: 10, strength: 1 },
    { sourceId: "x", targetId: "y", restLength: 10, strength: 1 }
  ];

  it("returns only the source node for k=0", () => {
    expect(getKHopNeighborhood("b", edges, 0)).toEqual(new Set(["b"]));
  });

  it("returns direct neighbors for k=1", () => {
    expect(getKHopNeighborhood("b", edges, 1)).toEqual(new Set(["a", "b", "c"]));
  });

  it("returns all nodes reachable within k hops", () => {
    expect(getKHopNeighborhood("b", edges, 2)).toEqual(new Set(["a", "b", "c", "d"]));
    expect(getKHopNeighborhood("b", edges, 2).has("x")).toBe(false);
  });
});
