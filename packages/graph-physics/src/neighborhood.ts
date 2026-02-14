import type { GraphEdge, NodeId } from "./types";

export function getKHopNeighborhood(
  nodeId: NodeId,
  edges: readonly GraphEdge[],
  k: number
): Set<NodeId> {
  const maxHops = Math.max(0, Math.floor(k));
  const visited = new Set<NodeId>([nodeId]);

  if (maxHops === 0) {
    return visited;
  }

  const adjacency = new Map<NodeId, NodeId[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.sourceId)) {
      adjacency.set(edge.sourceId, []);
    }
    if (!adjacency.has(edge.targetId)) {
      adjacency.set(edge.targetId, []);
    }
    adjacency.get(edge.sourceId)!.push(edge.targetId);
    adjacency.get(edge.targetId)!.push(edge.sourceId);
  }

  const queue: Array<{ id: NodeId; depth: number }> = [{ id: nodeId, depth: 0 }];
  let index = 0;

  while (index < queue.length) {
    const current = queue[index];
    index += 1;

    if (current.depth >= maxHops) {
      continue;
    }

    const neighbors = adjacency.get(current.id) ?? [];
    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) {
        continue;
      }

      visited.add(neighborId);
      queue.push({ id: neighborId, depth: current.depth + 1 });
    }
  }

  return visited;
}
