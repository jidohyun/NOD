export type NodeId = string;

export interface GraphNode {
  id: NodeId;
  x: number;
  y: number;
  mass: number;
}

export interface GraphEdge {
  id: string;
  source: NodeId;
  target: NodeId;
  strength: number;
}

export interface ClusterConstraint {
  id: string;
  nodeIds: NodeId[];
  radius: number;
}

export interface GraphPhysicsConfig {
  springStrength: number;
  damping: number;
  repulsionStrength: number;
}

export const DEFAULT_GRAPH_PHYSICS_CONFIG: GraphPhysicsConfig = {
  springStrength: 0.08,
  damping: 0.85,
  repulsionStrength: 320
};
