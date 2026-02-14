import { describe, expect, it } from "vitest";

import { createPreset } from "../presets";

describe("createPreset", () => {
  function expectInvariantBounds(presetName: "obsidianLike" | "dragActive" | "postDragCooldown") {
    const preset = createPreset(presetName);

    expect(preset.damping).toBeGreaterThan(0);
    expect(preset.damping).toBeLessThan(1);
    expect(preset.alpha).toBeGreaterThan(0);
    expect(preset.alphaDecay).toBeGreaterThan(0);
    expect(preset.alphaDecay).toBeLessThanOrEqual(1);
    expect(preset.alphaMin).toBeGreaterThanOrEqual(0);
    expect(preset.alphaMin).toBeLessThanOrEqual(preset.alpha);
    expect(preset.centerStrength).toBeGreaterThanOrEqual(0);
    expect(preset.repelStrength).toBeGreaterThan(0);
    expect(preset.springStrength).toBeGreaterThan(0);
    expect(preset.collisionStrength).toBeGreaterThan(0);
    expect(preset.tickStepsPerFrame).toBeGreaterThan(0);
  }

  it("returns valid damping and alpha bounds for obsidianLike", () => {
    expectInvariantBounds("obsidianLike");
  });

  it("returns valid damping and alpha bounds for dragActive", () => {
    expectInvariantBounds("dragActive");
  });

  it("returns valid damping and alpha bounds for postDragCooldown", () => {
    expectInvariantBounds("postDragCooldown");
  });

  it("returns a more responsive neighborhood profile for dragActive", () => {
    const base = createPreset("obsidianLike");
    const dragActive = createPreset("dragActive");

    expect(dragActive.localInfluenceBoost).toBeGreaterThan(base.localInfluenceBoost);
    expect(dragActive.dragNeighborhoodHops).toBeGreaterThanOrEqual(base.dragNeighborhoodHops);
    expect(dragActive.springStrength).toBeGreaterThan(base.springStrength);
  });

  it("returns cooldown profile with lower alpha than default", () => {
    const base = createPreset("obsidianLike");
    const cooldown = createPreset("postDragCooldown");

    expect(cooldown.alpha).toBeLessThan(base.alpha);
    expect(cooldown.alphaDecay).toBeLessThan(base.alphaDecay);
    expect(cooldown.damping).toBeGreaterThan(base.damping);
  });

  it("returns a cloned object for each call", () => {
    const first = createPreset("obsidianLike");
    const second = createPreset("obsidianLike");

    first.damping = 0.5;

    expect(second.damping).not.toBe(first.damping);
  });
});
