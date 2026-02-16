export interface ClusterArcInput {
  clusterId: string;
  weight: number;
}

export interface ClusterArc {
  clusterId: string;
  startAngle: number;
  endAngle: number;
}

export interface RingNodeInput {
  id: string;
  kind: "concept" | "article";
}

export interface RingEdgeInput {
  source: string;
  target: string;
}

export interface RingAnchor {
  nodeId: string;
  clusterId: string;
  targetRadius: number;
  targetAngle: number;
  orderIndex: number;
}

const TAU = Math.PI * 2;

function getOtherNodeId(edge: RingEdgeInput, nodeId: string): string | null {
  if (edge.source === nodeId) {
    return edge.target;
  }
  if (edge.target === nodeId) {
    return edge.source;
  }
  return null;
}

export function deriveClusterId(node: RingNodeInput, edges: RingEdgeInput[]): string {
  if (node.kind === "concept") {
    return node.id;
  }

  const conceptNeighbors = edges
    .map((edge) => getOtherNodeId(edge, node.id))
    .filter((value): value is string => value !== null && value.startsWith("concept:"))
    .sort((a, b) => a.localeCompare(b));

  if (conceptNeighbors.length > 0) {
    return conceptNeighbors[0];
  }

  return node.id;
}

export function allocateClusterArcs(input: ClusterArcInput[]): ClusterArc[] {
  const sortedInput = [...input].sort((a, b) => a.clusterId.localeCompare(b.clusterId));
  const totalWeight = sortedInput.reduce((sum, item) => sum + Math.max(1, item.weight), 0);

  if (totalWeight === 0) {
    return [];
  }

  let cursor = 0;

  return sortedInput.map((item) => {
    const span = (TAU * Math.max(1, item.weight)) / totalWeight;
    const arc: ClusterArc = {
      clusterId: item.clusterId,
      startAngle: cursor,
      endAngle: cursor + span,
    };
    cursor += span;
    return arc;
  });
}

function assignAnglesWithinArc(count: number, arc: ClusterArc): number[] {
  if (count <= 0) {
    return [];
  }

  if (count === 1) {
    return [(arc.startAngle + arc.endAngle) / 2];
  }

  const step = (arc.endAngle - arc.startAngle) / (count + 1);
  return Array.from({ length: count }, (_, index) => arc.startAngle + step * (index + 1));
}

export function buildRingAnchors(nodes: RingNodeInput[], edges: RingEdgeInput[]): RingAnchor[] {
  const nodesWithCluster = nodes.map((node) => ({
    ...node,
    clusterId: deriveClusterId(node, edges),
  }));

  const clusterWeightsMap = new Map<string, number>();
  for (const node of nodesWithCluster) {
    clusterWeightsMap.set(node.clusterId, (clusterWeightsMap.get(node.clusterId) ?? 0) + 1);
  }

  const clusterArcs = allocateClusterArcs(
    Array.from(clusterWeightsMap.entries()).map(([clusterId, weight]) => ({ clusterId, weight }))
  );

  const arcByCluster = new Map(clusterArcs.map((arc) => [arc.clusterId, arc]));
  const sortedNodes = [...nodesWithCluster].sort((a, b) => {
    if (a.clusterId !== b.clusterId) {
      return a.clusterId.localeCompare(b.clusterId);
    }
    if (a.kind !== b.kind) {
      return a.kind === "concept" ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  const nodesByCluster = new Map<string, typeof sortedNodes>();
  for (const node of sortedNodes) {
    const list = nodesByCluster.get(node.clusterId) ?? [];
    list.push(node);
    nodesByCluster.set(node.clusterId, list);
  }

  const anchorsByNodeId = new Map<string, RingAnchor>();

  for (const [clusterId, clusterNodes] of nodesByCluster.entries()) {
    const arc = arcByCluster.get(clusterId);
    if (!arc) {
      continue;
    }

    const angles = assignAnglesWithinArc(clusterNodes.length, arc);
    for (let index = 0; index < clusterNodes.length; index += 1) {
      const node = clusterNodes[index];
      anchorsByNodeId.set(node.id, {
        nodeId: node.id,
        clusterId,
        targetRadius: node.kind === "concept" ? 140 : 220,
        targetAngle: angles[index],
        orderIndex: index,
      });
    }
  }

  return sortedNodes
    .map((node) => anchorsByNodeId.get(node.id))
    .filter((anchor): anchor is RingAnchor => anchor !== undefined);
}

export function getKHopNeighborhood(
  nodeId: string,
  edges: RingEdgeInput[],
  k: number
): Set<string> {
  const adjacency = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, new Set<string>());
    }
    if (!adjacency.has(edge.target)) {
      adjacency.set(edge.target, new Set<string>());
    }
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>([nodeId]);
  let frontier = new Set<string>([nodeId]);

  for (let depth = 0; depth < k; depth += 1) {
    const nextFrontier = new Set<string>();
    for (const currentNodeId of frontier) {
      const neighbors = adjacency.get(currentNodeId);
      if (!neighbors) {
        continue;
      }
      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) {
          continue;
        }
        visited.add(neighborId);
        nextFrontier.add(neighborId);
      }
    }
    frontier = nextFrontier;
    if (frontier.size === 0) {
      break;
    }
  }

  return visited;
}
