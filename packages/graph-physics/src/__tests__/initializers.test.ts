import { describe, expect, it } from "vitest";

import { createDeterministicRingSeeds } from "../initializers";

describe("createDeterministicRingSeeds", () => {
  it("returns identical coordinates for the same ids regardless of input order", () => {
    const center = { x: 200, y: -120 };

    const seedsA = createDeterministicRingSeeds(["beta", "alpha", "gamma"], center);
    const seedsB = createDeterministicRingSeeds(["gamma", "beta", "alpha"], center);

    expect(seedsA).toEqual(seedsB);
    expect(Object.keys(seedsA)).toEqual(["alpha", "beta", "gamma"]);
  });

  it("places generated coordinates around the provided center", () => {
    const center = { x: 32, y: 64 };
    const ids = ["a", "b", "c", "d", "e", "f"];
    const seeds = createDeterministicRingSeeds(ids, center);
    const points = Object.values(seeds);

    const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;

    expect(meanX).toBeCloseTo(center.x, 10);
    expect(meanY).toBeCloseTo(center.y, 10);
  });
});
