import { describe, expect, it } from "vitest";
import type { ConceptGraphEdge, ConceptGraphNode } from "@/lib/api/articles";
import { GraphPhysicsAdapter, mapConceptGraphToPhysicsModel } from "../lib/graph-physics-adapter";

describe("GraphPhysicsAdapter", () => {
  const center = { x: 500, y: 300 };
  const nodes: ConceptGraphNode[] = [
    { id: "a", label: "Node A", value: 10 },
    { id: "b", label: "Node B", value: 20 },
    { id: "c", label: "Node C", value: 30 },
  ];

  const edges: ConceptGraphEdge[] = [
    { source: "a", target: "b", weight: 1 },
    { source: "b", target: "c", weight: 2 },
    { source: "c", target: "c", weight: 3 },
  ];

  it("maps ConceptGraph data to physics model with deterministic centered seeds", () => {
    const first = mapConceptGraphToPhysicsModel(nodes, edges, center);
    const reordered = mapConceptGraphToPhysicsModel([nodes[2], nodes[0], nodes[1]], edges, center);
    const shiftedCenter = { x: 640, y: 360 };
    const shifted = mapConceptGraphToPhysicsModel(nodes, edges, shiftedCenter);

    expect(first.nodes).toHaveLength(3);
    expect(first.edges).toHaveLength(2);

    expect(first.initialPositions.a).toEqual(reordered.initialPositions.a);
    expect(first.initialPositions.b).toEqual(reordered.initialPositions.b);
    expect(first.initialPositions.c).toEqual(reordered.initialPositions.c);

    expect(shifted.initialPositions.a).not.toEqual(first.initialPositions.a);
    expect(shifted.initialPositions.b).not.toEqual(first.initialPositions.b);
    expect(shifted.initialPositions.c).not.toEqual(first.initialPositions.c);

    const modelNodeA = first.nodes.find((node) => node.id === "a");
    expect(modelNodeA).toBeDefined();
    expect(modelNodeA?.pos.x).toBeCloseTo(first.initialPositions.a.x, 8);
    expect(modelNodeA?.pos.y).toBeCloseTo(first.initialPositions.a.y, 8);
  });

  it("initializes adapter with deterministic seeded positions", () => {
    const adapter = new GraphPhysicsAdapter(nodes, edges, center);
    const graphNodes = adapter.getNodes();

    expect(graphNodes).toHaveLength(3);

    const idToNode = new Map(graphNodes.map((node) => [node.id, node]));
    const seeded = adapter.getInitialPositions();
    expect(idToNode.get("a")?.radius).toBeLessThan(idToNode.get("c")?.radius ?? 0);

    for (const node of graphNodes) {
      expect(node.pos.x).toBeCloseTo(seeded[node.id].x, 8);
      expect(node.pos.y).toBeCloseTo(seeded[node.id].y, 8);
    }
  });

  it("updates positions on tick", () => {
    const adapter = new GraphPhysicsAdapter(nodes, edges, center);
    const initialNodes = adapter.getNodes();
    const initialPos = { ...initialNodes[0].pos };

    const updatedNodes = adapter.tick();
    const updatedPos = updatedNodes[0].pos;

    expect(updatedPos).not.toEqual(initialPos);
  });
});
