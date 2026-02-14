import { describe, expect, it } from "vitest";
import { allocateClusterArcs, buildRingAnchors } from "../lib/ring-physics";

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
