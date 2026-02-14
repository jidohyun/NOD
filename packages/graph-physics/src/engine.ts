import {
  applyCenterForce,
  applyCollisionForce,
  applyRepelForce,
  applySpringForce
} from "./forces";
import {
  applyDragEnd,
  applyDragMove,
  applyDragStart,
  DRAG_COOL_DECAY,
  DRAG_HOLD_ALPHA
} from "./drag";
import type { GraphEdge, GraphNode, NodeId, Position, Velocity } from "./types";

export interface GraphEngineOptions {
  center: Position;
  dt?: number;
  damping?: number;
  alpha?: number;
  alphaDecay?: number;
  alphaMin?: number;
  centerStrength?: number;
  repelStrength?: number;
  springStrength?: number;
  collisionStrength?: number;
  collisionPadding?: number;
}

const DEFAULT_OPTIONS: Required<GraphEngineOptions> = {
  center: { x: 0, y: 0 },
  dt: 1,
  damping: 0.9,
  alpha: 1,
  alphaDecay: 0.99,
  alphaMin: 0,
  centerStrength: 0.1,
  repelStrength: 50,
  springStrength: 0.2,
  collisionStrength: 0.5,
  collisionPadding: 0
};

function cloneNode(node: GraphNode): GraphNode {
  return {
    ...node,
    pos: { ...node.pos },
    vel: { ...node.vel }
  };
}

export class GraphEngine {
  private readonly nodes: GraphNode[];
  private readonly edges: GraphEdge[];
  private readonly options: Required<GraphEngineOptions>;
  private alpha: number;
  private isDragCooling: boolean;

  constructor(nodes: readonly GraphNode[], edges: readonly GraphEdge[], options: GraphEngineOptions) {
    this.nodes = nodes.map(cloneNode);
    this.edges = edges.map((edge) => ({ ...edge }));
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      center: { ...options.center }
    };
    this.alpha = this.options.alpha;
    this.isDragCooling = false;
  }

  public onDragStart(nodeId: NodeId, cursor: Position): void {
    const node = this.nodes.find((currentNode) => currentNode.id === nodeId);
    if (!node) {
      return;
    }

    const targetAlpha = applyDragStart(node, cursor);
    this.alpha = Math.max(this.alpha, targetAlpha);
    this.isDragCooling = false;
  }

  public onDragMove(nodeId: NodeId, cursor: Position): void {
    const node = this.nodes.find((currentNode) => currentNode.id === nodeId);
    if (!node) {
      return;
    }

    applyDragMove(node, cursor);
    this.alpha = DRAG_HOLD_ALPHA;
    this.isDragCooling = false;
  }

  public onDragEnd(nodeId: NodeId): void {
    const node = this.nodes.find((currentNode) => currentNode.id === nodeId);
    if (!node) {
      return;
    }

    const targetAlpha = applyDragEnd(node);
    this.alpha = targetAlpha;
    this.isDragCooling = true;
  }

  public tick(): void {
    const forces = new Map<NodeId, Velocity>();
    const nodeById = new Map<NodeId, GraphNode>();

    for (const node of this.nodes) {
      if (node.pinned) {
        if (node.fx !== undefined) {
          node.pos.x = node.fx;
        }
        if (node.fy !== undefined) {
          node.pos.y = node.fy;
        }
        node.vel.vx = 0;
        node.vel.vy = 0;
      }

      forces.set(node.id, { vx: 0, vy: 0 });
      nodeById.set(node.id, node);
    }

    for (const node of this.nodes) {
      const centerForce = applyCenterForce(node, this.options.center, {
        strength: this.options.centerStrength * this.alpha
      });
      const sum = forces.get(node.id);
      if (!sum) {
        continue;
      }
      sum.vx += centerForce.vx;
      sum.vy += centerForce.vy;
    }

    for (let i = 0; i < this.nodes.length; i += 1) {
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const a = this.nodes[i];
        const b = this.nodes[j];

        const repel = applyRepelForce(a, b, {
          strength: this.options.repelStrength * this.alpha
        });
        const collision = applyCollisionForce(a, b, {
          strength: this.options.collisionStrength * this.alpha,
          padding: this.options.collisionPadding
        });

        const forceA = forces.get(a.id);
        const forceB = forces.get(b.id);
        if (!forceA || !forceB) {
          continue;
        }

        forceA.vx += repel.a.vx + collision.a.vx;
        forceA.vy += repel.a.vy + collision.a.vy;
        forceB.vx += repel.b.vx + collision.b.vx;
        forceB.vy += repel.b.vy + collision.b.vy;
      }
    }

    for (const edge of this.edges) {
      const source = nodeById.get(edge.sourceId);
      const target = nodeById.get(edge.targetId);
      if (!source || !target) {
        continue;
      }

      const spring = applySpringForce(source, target, {
        restLength: edge.restLength,
        strength: this.options.springStrength * edge.strength * this.alpha
      });

      const sourceForce = forces.get(source.id);
      const targetForce = forces.get(target.id);
      if (!sourceForce || !targetForce) {
        continue;
      }

      sourceForce.vx += spring.source.vx;
      sourceForce.vy += spring.source.vy;
      targetForce.vx += spring.target.vx;
      targetForce.vy += spring.target.vy;
    }

    for (const node of this.nodes) {
      const force = forces.get(node.id);
      if (!force) {
        continue;
      }

      if (node.pinned) {
        if (node.fx !== undefined) {
          node.pos.x = node.fx;
        }
        if (node.fy !== undefined) {
          node.pos.y = node.fy;
        }
        node.vel.vx = 0;
        node.vel.vy = 0;
        continue;
      }

      node.vel.vx = (node.vel.vx + force.vx * this.options.dt) * this.options.damping;
      node.vel.vy = (node.vel.vy + force.vy * this.options.dt) * this.options.damping;

      node.pos.x += node.vel.vx * this.options.dt;
      node.pos.y += node.vel.vy * this.options.dt;
    }

    if (this.isDragCooling) {
      this.alpha = Math.max(0, this.alpha * DRAG_COOL_DECAY);
      if (this.alpha < 0.0001) {
        this.alpha = 0;
        this.isDragCooling = false;
      }
      return;
    }

    this.alpha = Math.max(this.options.alphaMin, this.alpha * this.options.alphaDecay);
  }

  public getNodes(): GraphNode[] {
    return this.nodes.map(cloneNode);
  }

  public getAlpha(): number {
    return this.alpha;
  }
}
