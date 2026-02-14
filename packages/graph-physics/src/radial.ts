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
    return { x: 1, y: 0, distance: 0 };
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
