import type { NodeId, Position } from "./types";

function stableHash(input: string): number {
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }

  return hash >>> 0;
}

export function createDeterministicRingSeeds(
  ids: readonly NodeId[],
  center: Position
): Record<NodeId, Position> {
  const sortedIds = Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b));
  const total = sortedIds.length;

  if (total === 0) {
    return {};
  }

  const rotation = stableHash(sortedIds.join("|")) % total;
  const radius = Math.max(24, total * 12);

  return sortedIds.reduce<Record<NodeId, Position>>((seeds, id, index) => {
    const slot = (index + rotation) % total;
    const angle = (Math.PI * 2 * slot) / total;

    seeds[id] = {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };

    return seeds;
  }, {});
}
