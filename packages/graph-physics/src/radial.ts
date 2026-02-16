import type { NodeId, Position, Velocity } from "./types";

interface NodePoint {
  id: NodeId;
  pos: Position;
}

interface RadialOptions {
  targetRadius: number;
  strength: number;
}

function getRadialDirection(node: NodePoint, center: Position): { x: number; y: number; distance: number } {
  const dx = node.pos.x - center.x;
  const dy = node.pos.y - center.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    // Deterministic fallback based on node ID to avoid constant +X bias
    let hash = 0;
    const idStr = String(node.id);
    for (let i = 0; i < idStr.length; i++) {
      hash = (hash << 5) - hash + idStr.charCodeAt(i);
      hash |= 0;
    }
    const angle = (Math.abs(hash) % 1000) / 1000 * 2 * Math.PI;
    return { x: Math.cos(angle), y: Math.sin(angle), distance: 0 };
  }

  return {
    x: dx / distance,
    y: dy / distance,
    distance
  };
}

export function applyRadialForce(
  node: NodePoint,
  center: Position,
  options: RadialOptions
): Velocity {
  const direction = getRadialDirection(node, center);
  const magnitude = options.strength * (options.targetRadius - direction.distance);

  return {
    vx: direction.x * magnitude,
    vy: direction.y * magnitude
  };
}
