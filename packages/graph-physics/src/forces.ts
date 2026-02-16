import type { NodeId, Position, Velocity } from "./types";

interface NodePoint {
  id: NodeId;
  pos: Position;
}

interface CircleNode extends NodePoint {
  radius: number;
}

interface ForcePair {
  a: Velocity;
  b: Velocity;
}

interface SpringPair {
  source: Velocity;
  target: Velocity;
}

interface StrengthOptions {
  strength: number;
}

interface SpringOptions extends StrengthOptions {
  restLength: number;
}

interface CollisionOptions extends StrengthOptions {
  padding?: number;
}

function deterministicDirection(aId: NodeId, bId: NodeId): { x: number; y: number } {
  return aId < bId ? { x: 1, y: 0 } : { x: -1, y: 0 };
}

function sanitizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

function getDirection(a: NodePoint, b: NodePoint): { x: number; y: number; distance: number } {
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    const fallback = deterministicDirection(a.id, b.id);
    return {
      x: fallback.x,
      y: fallback.y,
      distance: 1
    };
  }

  return {
    x: dx / distance,
    y: dy / distance,
    distance
  };
}

export function applyCenterForce(
  node: NodePoint,
  center: Position,
  options: StrengthOptions
): Velocity {
  return {
    vx: (center.x - node.pos.x) * options.strength,
    vy: (center.y - node.pos.y) * options.strength
  };
}

export function applyRepelForce(a: NodePoint, b: NodePoint, options: StrengthOptions): ForcePair {
  const direction = getDirection(a, b);
  const magnitude = options.strength / (direction.distance * direction.distance);

  return {
    a: {
      vx: sanitizeZero(-direction.x * magnitude),
      vy: sanitizeZero(-direction.y * magnitude)
    },
    b: {
      vx: sanitizeZero(direction.x * magnitude),
      vy: sanitizeZero(direction.y * magnitude)
    }
  };
}

export function applySpringForce(a: NodePoint, b: NodePoint, options: SpringOptions): SpringPair {
  const direction = getDirection(a, b);
  const stretch = direction.distance - options.restLength;
  const magnitude = stretch * options.strength;

  return {
    source: {
      vx: sanitizeZero(direction.x * magnitude),
      vy: sanitizeZero(direction.y * magnitude)
    },
    target: {
      vx: sanitizeZero(-direction.x * magnitude),
      vy: sanitizeZero(-direction.y * magnitude)
    }
  };
}

export function applyCollisionForce(
  a: CircleNode,
  b: CircleNode,
  options: CollisionOptions
): ForcePair {
  const direction = getDirection(a, b);
  const minDistance = a.radius + b.radius + (options.padding ?? 0);
  const overlap = minDistance - direction.distance;

  if (overlap <= 0) {
    return {
      a: { vx: 0, vy: 0 },
      b: { vx: 0, vy: 0 }
    };
  }

  const magnitude = overlap * options.strength;

  return {
    a: {
      vx: sanitizeZero(-direction.x * magnitude),
      vy: sanitizeZero(-direction.y * magnitude)
    },
    b: {
      vx: sanitizeZero(direction.x * magnitude),
      vy: sanitizeZero(direction.y * magnitude)
    }
  };
}
