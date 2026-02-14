import type { ConceptGraphEdge, ConceptGraphNode } from "@/lib/api/articles";
import {
  createDeterministicRingSeeds,
  createPreset,
  type GraphEdge,
  GraphEngine,
  type GraphEngineOptions,
  type GraphNode,
  type GraphPhysicsPresetName,
  type NodeId,
  type Position,
} from "../../../../../../packages/graph-physics/src";

const MIN_NODE_RADIUS = 7;
const MAX_NODE_RADIUS = 17;
const DEFAULT_EDGE_REST_LENGTH = 150;
const DEFAULT_EDGE_STRENGTH = 0.7;

export interface ConceptGraphPhysicsModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
  initialPositions: Record<NodeId, Position>;
}

export interface GraphPhysicsAdapterOptions extends Partial<GraphEngineOptions> {
  preset?: GraphPhysicsPresetName;
  tickStepsPerFrame?: number;
}

function toNodeRadius(value: number, maxValue: number): number {
  if (maxValue <= 1) {
    return MIN_NODE_RADIUS;
  }

  const normalized = Math.max(0, Math.min(1, (value - 1) / (maxValue - 1)));
  return MIN_NODE_RADIUS + normalized * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);
}

function clonePositions(positions: Record<NodeId, Position>): Record<NodeId, Position> {
  const copy: Record<NodeId, Position> = {};

  for (const [id, position] of Object.entries(positions)) {
    copy[id] = { ...position };
  }

  return copy;
}

export function mapConceptGraphToPhysicsModel(
  nodes: readonly ConceptGraphNode[],
  edges: readonly ConceptGraphEdge[],
  center: Position
): ConceptGraphPhysicsModel {
  const initialPositions = createDeterministicRingSeeds(
    nodes.map((node) => node.id),
    center
  );
  const maxValue = Math.max(1, ...nodes.map((node) => node.value));
  const nodeIdSet = new Set(nodes.map((node) => node.id));

  const physicsNodes: GraphNode[] = nodes.map((node) => {
    const seed = initialPositions[node.id] ?? center;

    return {
      id: node.id,
      pos: { ...seed },
      vel: { vx: 0, vy: 0 },
      radius: toNodeRadius(node.value, maxValue),
      pinned: false,
      mass: 1,
      charge: 1,
    };
  });

  const physicsEdges: GraphEdge[] = edges
    .filter(
      (edge) =>
        edge.source !== edge.target && nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)
    )
    .map((edge) => ({
      sourceId: edge.source,
      targetId: edge.target,
      restLength: DEFAULT_EDGE_REST_LENGTH,
      strength: DEFAULT_EDGE_STRENGTH,
      weight: edge.weight,
    }));

  return {
    nodes: physicsNodes,
    edges: physicsEdges,
    initialPositions,
  };
}

export class GraphPhysicsAdapter {
  private readonly engine: GraphEngine;
  private readonly tickStepsPerFrame: number;
  private readonly initialPositions: Record<NodeId, Position>;

  constructor(
    nodes: readonly ConceptGraphNode[],
    edges: readonly ConceptGraphEdge[],
    center: Position,
    options?: GraphPhysicsAdapterOptions
  ) {
    const { preset = "obsidianLike", tickStepsPerFrame, ...engineOptions } = options ?? {};
    const presetConfig = createPreset(preset);
    const { tickStepsPerFrame: presetTickStepsPerFrame, ...presetEngineOptions } = presetConfig;
    const physicsModel = mapConceptGraphToPhysicsModel(nodes, edges, center);

    this.initialPositions = physicsModel.initialPositions;
    this.tickStepsPerFrame = Math.max(1, Math.floor(tickStepsPerFrame ?? presetTickStepsPerFrame));
    this.engine = new GraphEngine(physicsModel.nodes, physicsModel.edges, {
      ...presetEngineOptions,
      ...engineOptions,
      center,
    });
  }

  public getInitialPositions(): Record<NodeId, Position> {
    return clonePositions(this.initialPositions);
  }

  public tick(): GraphNode[] {
    for (let index = 0; index < this.tickStepsPerFrame; index += 1) {
      this.engine.tick();
    }

    return this.engine.getNodes();
  }

  public getNodes(): GraphNode[] {
    return this.engine.getNodes();
  }

  public onDragStart(nodeId: NodeId, position: Position): void {
    this.engine.onDragStart(nodeId, position);
  }

  public onDragMove(nodeId: NodeId, position: Position): void {
    this.engine.onDragMove(nodeId, position);
  }

  public onDragEnd(nodeId: NodeId): void {
    this.engine.onDragEnd(nodeId);
  }
}
