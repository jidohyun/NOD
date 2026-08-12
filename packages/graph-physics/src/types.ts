export type NodeId = string;

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface GraphNode {
  id: NodeId;
  pos: Position;
  vel: Velocity;
  radius: number;
  pinned: boolean;
  mass?: number;
  charge?: number;
  fx?: number;
  fy?: number;
}

export interface GraphEdge {
  sourceId: NodeId;
  targetId: NodeId;
  restLength: number;
  strength: number;
  weight?: number;
}
