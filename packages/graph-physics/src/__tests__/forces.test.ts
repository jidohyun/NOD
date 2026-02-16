import { describe, expect, it } from "vitest";

import {
  applyCenterForce,
  applyCollisionForce,
  applyRepelForce,
  applySpringForce
} from "../forces";

describe("force primitives", () => {
  it("produces deterministic repel direction for overlapping nodes", () => {
    const a = { id: "a", pos: { x: 0, y: 0 } };
    const b = { id: "b", pos: { x: 0, y: 0 } };

    const delta = applyRepelForce(a, b, { strength: 20 });

    expect(delta.a.vx).toBeLessThan(0);
    expect(delta.b.vx).toBeGreaterThan(0);
    expect(delta.a.vy).toBe(0);
    expect(delta.b.vy).toBe(0);
    expect(delta.a.vx).toBeCloseTo(-delta.b.vx, 10);
  });

  it("pushes colliding nodes apart in deterministic direction", () => {
    const a = { id: "a", pos: { x: 5, y: 5 }, radius: 10 };
    const b = { id: "b", pos: { x: 5, y: 5 }, radius: 10 };

    const correction = applyCollisionForce(a, b, { strength: 1 });

    expect(correction.a.vx).toBeLessThan(0);
    expect(correction.b.vx).toBeGreaterThan(0);
    expect(correction.a.vy).toBe(0);
    expect(correction.b.vy).toBe(0);
    expect(correction.a.vx).toBeCloseTo(-correction.b.vx, 10);
  });

  it("corrects stretched spring links by pulling endpoints together", () => {
    const source = { id: "source", pos: { x: 0, y: 0 } };
    const target = { id: "target", pos: { x: 10, y: 0 } };

    const spring = applySpringForce(source, target, {
      restLength: 4,
      strength: 0.5
    });

    expect(spring.source.vx).toBeGreaterThan(0);
    expect(spring.target.vx).toBeLessThan(0);
    expect(spring.source.vx).toBeCloseTo(-spring.target.vx, 10);
    expect(spring.source.vy).toBe(0);
    expect(spring.target.vy).toBe(0);
  });

  it("computes center force toward target center", () => {
    const node = { id: "n", pos: { x: -10, y: 10 } };
    const force = applyCenterForce(node, { x: 0, y: 0 }, { strength: 0.25 });

    expect(force.vx).toBeGreaterThan(0);
    expect(force.vy).toBeLessThan(0);
  });
});
