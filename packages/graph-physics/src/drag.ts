import type { GraphNode, Position } from "./types";

export const DRAG_REHEAT_ALPHA = 0.9;
export const DRAG_HOLD_ALPHA = 0.4;
export const DRAG_RELEASE_ALPHA = 0.2;
export const DRAG_COOL_DECAY = 0.85;

export function applyDragStart(node: GraphNode, cursor: Position): number {
  node.pinned = true;
  node.fx = cursor.x;
  node.fy = cursor.y;
  node.vel.vx = 0;
  node.vel.vy = 0;

  return DRAG_REHEAT_ALPHA;
}

export function applyDragMove(node: GraphNode, cursor: Position): number {
  node.pinned = true;
  node.fx = cursor.x;
  node.fy = cursor.y;

  return DRAG_HOLD_ALPHA;
}

export function applyDragEnd(node: GraphNode): number {
  node.pinned = false;
  delete node.fx;
  delete node.fy;
  node.vel.vx = 0;
  node.vel.vy = 0;

  return DRAG_RELEASE_ALPHA;
}
