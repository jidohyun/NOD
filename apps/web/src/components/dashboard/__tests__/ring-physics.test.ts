import { describe, expect, it } from "vitest";
import { allocateClusterArcs } from "../lib/ring-physics";

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
