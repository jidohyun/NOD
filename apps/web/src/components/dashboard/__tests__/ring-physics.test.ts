import { describe, expect, it } from "vitest";
import { allocateClusterArcs, buildRingAnchors, getKHopNeighborhood } from "../lib/ring-physics";

describe("allocateClusterArcs", () => {
  it("allocates deterministic non-overlapping arc ranges", () => {
    const arcs = allocateClusterArcs([
      { clusterId: "a", weight: 3 },
      { clusterId: "b", weight: 1 },
    ]);
    expect(arcs).toHaveLength(2);
    expect(arcs[0].startAngle).toBeLessThan(arcs[0].endAngle);
  });
});

it("creates stable targetAngle per node across reruns", () => {
  const nodes = [
    { id: "concept:react", kind: "concept" as const },
    { id: "article:1", kind: "article" as const },
    { id: "article:2", kind: "article" as const },
  ];
  const edges = [
    { source: "concept:react", target: "article:1" },
    { source: "concept:react", target: "article:2" },
  ];

  const a = buildRingAnchors(nodes, edges);
  const b = buildRingAnchors(nodes, edges);

  expect(a).toEqual(b);
});

it("returns 1-hop and 2-hop neighborhoods correctly", () => {
  const edges = [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
    { source: "c", target: "d" },
  ];

  expect(getKHopNeighborhood("a", edges, 1)).toEqual(new Set(["a", "b"]));
  expect(getKHopNeighborhood("a", edges, 2)).toEqual(new Set(["a", "b", "c"]));
});
