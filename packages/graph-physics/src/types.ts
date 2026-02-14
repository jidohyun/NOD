export interface GraphNode {
  id: string;
  pos: {
    x: number;
    y: number;
  };
  vel: {
    vx: number;
    vy: number;
  };
  radius: number;
  pinned: boolean;
  mass?: number;
  charge?: number;
  fx?: number;
  fy?: number;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  restLength: number;
  strength: number;
  weight?: number;
}
