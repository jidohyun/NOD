import type { GraphEngineOptions } from "./engine";

export type GraphPhysicsPresetName = "obsidianLike" | "dragActive" | "postDragCooldown";

export interface GraphPhysicsPreset extends Required<Omit<GraphEngineOptions, "center">> {
  tickStepsPerFrame: number;
}

const PRESET_MATRIX: Record<GraphPhysicsPresetName, GraphPhysicsPreset> = {
  obsidianLike: {
    dt: 1,
    damping: 0.9,
    alpha: 1,
    alphaDecay: 0.99,
    alphaMin: 0.001,
    centerStrength: 0.08,
    repelStrength: 1200,
    springStrength: 0.85,
    collisionStrength: 1,
    collisionPadding: 2,
    dragNeighborhoodHops: 1,
    localInfluenceBoost: 2,
    radialEnabled: false,
    radialTargetRadius: 0,
    radialStrength: 0,
    tickStepsPerFrame: 1,
  },
  dragActive: {
    dt: 1,
    damping: 0.88,
    alpha: 1,
    alphaDecay: 0.995,
    alphaMin: 0.001,
    centerStrength: 0.06,
    repelStrength: 1350,
    springStrength: 0.95,
    collisionStrength: 1.2,
    collisionPadding: 2,
    dragNeighborhoodHops: 2,
    localInfluenceBoost: 3,
    radialEnabled: false,
    radialTargetRadius: 0,
    radialStrength: 0,
    tickStepsPerFrame: 1,
  },
  postDragCooldown: {
    dt: 1,
    damping: 0.92,
    alpha: 0.3,
    alphaDecay: 0.97,
    alphaMin: 0,
    centerStrength: 0.1,
    repelStrength: 1000,
    springStrength: 0.7,
    collisionStrength: 0.8,
    collisionPadding: 1,
    dragNeighborhoodHops: 1,
    localInfluenceBoost: 1.5,
    radialEnabled: false,
    radialTargetRadius: 0,
    radialStrength: 0,
    tickStepsPerFrame: 1,
  },
};

export function createPreset(name: GraphPhysicsPresetName): GraphPhysicsPreset {
  return { ...PRESET_MATRIX[name] };
}
