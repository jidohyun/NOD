export interface ClusterArcInput {
  clusterId: string;
  weight: number;
}

export interface ClusterArc {
  clusterId: string;
  startAngle: number;
  endAngle: number;
}

export function allocateClusterArcs(input: ClusterArcInput[]): ClusterArc[] {
  return input.map((value, index) => ({
    clusterId: value.clusterId,
    startAngle: index,
    endAngle: index + 0.5,
  }));
}
