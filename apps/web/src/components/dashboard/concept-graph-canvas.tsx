"use client";

import cytoscape, {
  type Core,
  type ElementDefinition,
  type EventObject,
  type NodeSingular,
} from "cytoscape";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ConceptGraphEdge, ConceptGraphNode } from "@/lib/api/articles";
import { cn } from "@/lib/utils";
import { GraphPhysicsAdapter } from "./lib/graph-physics-adapter";

interface ConceptGraphCanvasProps {
  nodes: ConceptGraphNode[];
  edges: ConceptGraphEdge[];
  readOnly?: boolean;
  className?: string;
  highlightNodeIds?: string[];
  onSelectionChange?: (state: GraphSelectionState) => void;
  onPinnedNodeIdsChange?: (ids: string[]) => void;
  onNodeOpen?: (nodeId: string, options: { newTab: boolean }) => void;
  labels?: Partial<ContextMenuLabels>;
}

export interface GraphSelectionState {
  selectedNodeIds: string[];
  primaryNodeId: string | null;
}

export interface ConceptGraphCanvasHandle {
  focusNode: (nodeId: string) => void;
  selectSingle: (nodeId: string) => void;
  clearSelection: () => void;
  pinSelected: () => void;
  unpinSelected: () => void;
  unpinAll: () => void;
}

interface GraphThemeTokens {
  nodeColor: string;
  nodeBorderColor: string;
  nodeHoverColor: string;
  nodeSelectedColor: string;
  labelColor: string;
  labelOutlineColor: string;
  edgeColor: string;
  edgeHoverColor: string;
  fadedOpacity: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
}

interface ContextMenuLabels {
  pin: string;
  unpin: string;
  unpinAll: string;
  pinSelected: string;
}

const DEFAULT_CONTEXT_MENU_LABELS: ContextMenuLabels = {
  pin: "Pin",
  unpin: "Unpin",
  unpinAll: "Unpin all",
  pinSelected: "Pin selected",
};

function getGraphThemeTokens(): GraphThemeTokens {
  const isDark = document.documentElement.classList.contains("dark");

  if (isDark) {
    return {
      nodeColor: "#E8B931",
      nodeBorderColor: "#F2CF69",
      nodeHoverColor: "#F5D26D",
      nodeSelectedColor: "#F8D970",
      labelColor: "rgba(237,240,247,0.92)",
      labelOutlineColor: "rgba(10,10,11,0.72)",
      edgeColor: "rgba(226,232,240,0.28)",
      edgeHoverColor: "rgba(250,252,255,0.8)",
      fadedOpacity: 0.24,
    };
  }

  return {
    nodeColor: "#C8941D",
    nodeBorderColor: "#E8B931",
    nodeHoverColor: "#B07A07",
    nodeSelectedColor: "#9A6A05",
    labelColor: "rgba(15,23,42,0.84)",
    labelOutlineColor: "rgba(255,255,255,0.92)",
    edgeColor: "rgba(15,23,42,0.24)",
    edgeHoverColor: "rgba(15,23,42,0.72)",
    fadedOpacity: 0.16,
  };
}

function buildLayout(readOnly: boolean): cytoscape.LayoutOptions {
  if (readOnly) {
    return {
      name: "concentric",
      animate: false,
      fit: true,
      padding: 22,
      avoidOverlap: true,
      spacingFactor: 0.5,
    };
  }

  return {
    name: "preset",
    animate: false,
    fit: true,
    padding: 80,
  };
}

function buildElements(
  nodes: readonly ConceptGraphNode[],
  edges: readonly ConceptGraphEdge[],
  initialPositions?: Record<string, { x: number; y: number }>
): ElementDefinition[] {
  const nodeElements: ElementDefinition[] = nodes.map((node) => ({
    group: "nodes",
    data: {
      id: node.id,
      label: node.label,
      value: node.value,
    },
    position: initialPositions?.[node.id],
  }));

  const nodeIdSet = new Set(nodes.map((node) => node.id));
  const edgeElements: ElementDefinition[] = edges
    .filter(
      (edge) =>
        edge.source !== edge.target && nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)
    )
    .map((edge, index) => ({
      group: "edges",
      data: {
        id: `edge-${index}-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
      },
    }));

  return [...nodeElements, ...edgeElements];
}

function buildStyles(
  readOnly: boolean,
  maxNodeValue: number,
  maxEdgeWeight: number,
  tokens: GraphThemeTokens,
  showNodeLabels: boolean
): cytoscape.StylesheetJson {
  return [
    {
      selector: "node",
      style: {
        "background-color": tokens.nodeColor,
        "border-color": tokens.nodeBorderColor,
        "border-width": 1,
        label: readOnly || !showNodeLabels ? "" : "data(label)",
        color: tokens.labelColor,
        "font-size": "11px",
        "text-max-width": "120px",
        "text-wrap": "wrap" as const,
        "text-valign": "bottom" as const,
        "text-margin-y": 10,
        "text-outline-width": 2,
        "text-outline-color": tokens.labelOutlineColor,
        width: `mapData(value, 1, ${maxNodeValue}, 14, 34)`,
        height: `mapData(value, 1, ${maxNodeValue}, 14, 34)`,
      },
    },
    {
      selector: "edge",
      style: {
        width: `mapData(weight, 1, ${maxEdgeWeight}, 1, 5)`,
        "line-color": tokens.edgeColor,
        opacity: 0.82,
        "curve-style": "bezier" as const,
      },
    },
    {
      selector: "node:selected",
      style: {
        "background-color": tokens.nodeSelectedColor,
        "border-width": 3,
        opacity: 1,
      },
    },
    {
      selector: "node.pinned",
      style: {
        "border-style": "dotted",
        "border-width": 2,
      },
    },
    {
      selector: "node.search-match",
      style: {
        "border-width": 2,
      },
    },
    {
      selector: ".unhover",
      style: {
        opacity: tokens.fadedOpacity,
      },
    },
    {
      selector: "node.hover",
      style: {
        "background-color": tokens.nodeHoverColor,
        opacity: 1,
        "border-width": 2,
      },
    },
    {
      selector: "edge.connected-hover",
      style: {
        "line-color": tokens.edgeHoverColor,
        opacity: 1,
        width: 2,
      },
    },
  ];
}

export const ConceptGraphCanvas = forwardRef<ConceptGraphCanvasHandle, ConceptGraphCanvasProps>(
  function ConceptGraphCanvas(
    {
      nodes,
      edges,
      readOnly = false,
      className,
      highlightNodeIds,
      onSelectionChange,
      onPinnedNodeIdsChange,
      onNodeOpen,
      labels,
    },
    ref
  ) {
    const mergedLabels = { ...DEFAULT_CONTEXT_MENU_LABELS, ...labels };
    const containerRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const cyRef = useRef<Core | null>(null);
    const adapterRef = useRef<GraphPhysicsAdapter | null>(null);
    const rafRef = useRef<number | null>(null);
    const primaryNodeIdRef = useRef<string | null>(null);
    const [selectionState, setSelectionState] = useState<GraphSelectionState>({
      selectedNodeIds: [],
      primaryNodeId: null,
    });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const highlightNodeIdSet = useMemo(() => new Set(highlightNodeIds ?? []), [highlightNodeIds]);

    const showNodeLabels = nodes.length <= 1000;

    const maxNodeValue = useMemo(() => Math.max(1, ...nodes.map((node) => node.value)), [nodes]);
    const maxEdgeWeight = useMemo(() => Math.max(1, ...edges.map((edge) => edge.weight)), [edges]);

    const emitSelectionState = useCallback(() => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      const selectedNodeIds = cy
        .$("node:selected")
        .toArray()
        .map((node) => node.id());

      let primaryNodeId = primaryNodeIdRef.current;
      if (!primaryNodeId || !selectedNodeIds.includes(primaryNodeId)) {
        primaryNodeId = selectedNodeIds[0] ?? null;
      }
      primaryNodeIdRef.current = primaryNodeId;

      const state = { selectedNodeIds, primaryNodeId };
      setSelectionState(state);
      onSelectionChange?.(state);
    }, [onSelectionChange]);

    const emitPinnedIds = useCallback(() => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      const pinned = cy
        .$("node.pinned")
        .toArray()
        .map((node) => node.id());
      onPinnedNodeIdsChange?.(pinned);
    }, [onPinnedNodeIdsChange]);

    const pinNodes = useCallback(
      (nodesToPin: NodeSingular[]) => {
        for (const node of nodesToPin) {
          node.lock();
          node.addClass("pinned");
          const position = node.position();
          adapterRef.current?.onDragStart(node.id(), { x: position.x, y: position.y });
          adapterRef.current?.onDragMove(node.id(), { x: position.x, y: position.y });
        }
        emitPinnedIds();
      },
      [emitPinnedIds]
    );

    const unpinNodes = useCallback(
      (nodesToUnpin: NodeSingular[]) => {
        for (const node of nodesToUnpin) {
          node.unlock();
          node.removeClass("pinned");
          adapterRef.current?.onDragEnd(node.id());
        }
        emitPinnedIds();
      },
      [emitPinnedIds]
    );

    const clearSelection = useCallback(() => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      cy.nodes().unselect();
      primaryNodeIdRef.current = null;
      emitSelectionState();
    }, [emitSelectionState]);

    const unpinAll = useCallback(() => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      const pinnedNodes = cy.$("node.pinned").nodes().toArray();
      unpinNodes(pinnedNodes);
    }, [unpinNodes]);

    const pinSelected = useCallback(() => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      pinNodes(cy.$("node:selected").nodes().toArray());
    }, [pinNodes]);

    const unpinSelected = useCallback(() => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      unpinNodes(cy.$("node:selected").nodes().toArray());
    }, [unpinNodes]);

    const focusNode = useCallback((nodeId: string) => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      const node = cy.$id(nodeId);
      if (node.empty()) {
        return;
      }
      cy.animate(
        {
          fit: { eles: node, padding: 120 },
        },
        {
          duration: 220,
        }
      );
    }, []);

    const selectSingle = useCallback(
      (nodeId: string) => {
        const cy = cyRef.current;
        if (!cy) {
          return;
        }
        const node = cy.$id(nodeId);
        if (node.empty()) {
          return;
        }
        cy.nodes().unselect();
        node.select();
        primaryNodeIdRef.current = nodeId;
        emitSelectionState();
        focusNode(nodeId);
      },
      [emitSelectionState, focusNode]
    );

    useImperativeHandle(
      ref,
      () => ({
        focusNode,
        selectSingle,
        clearSelection,
        pinSelected,
        unpinSelected,
        unpinAll,
      }),
      [clearSelection, focusNode, pinSelected, selectSingle, unpinAll, unpinSelected]
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      cyRef.current?.destroy();
      adapterRef.current = null;

      const containerRect = container.getBoundingClientRect();
      const center = {
        x: Math.max(1, containerRect.width / 2),
        y: Math.max(1, containerRect.height / 2),
      };

      const adapter = readOnly ? null : new GraphPhysicsAdapter(nodes, edges, center);
      adapterRef.current = adapter;

      const cy = cytoscape({
        container,
        elements: buildElements(nodes, edges, adapter?.getInitialPositions()),
        layout: buildLayout(readOnly),
        style: buildStyles(
          readOnly,
          maxNodeValue,
          maxEdgeWeight,
          getGraphThemeTokens(),
          showNodeLabels
        ),
        userZoomingEnabled: !readOnly,
        userPanningEnabled: !readOnly,
        boxSelectionEnabled: !readOnly,
        autoungrabify: readOnly,
        autounselectify: readOnly,
        wheelSensitivity: 0.15,
        minZoom: 0.2,
        maxZoom: 2.5,
        pixelRatio: 1,
      });

      cyRef.current = cy;

      const syncPhysicsFrame = () => {
        const instance = cyRef.current;
        const activeAdapter = adapterRef.current;
        if (!instance || !activeAdapter || readOnly) {
          return;
        }

        const physicsNodes = activeAdapter.tick();
        instance.batch(() => {
          for (const physicsNode of physicsNodes) {
            const graphNode = instance.$id(physicsNode.id);
            if (graphNode.empty() || graphNode.locked() || graphNode.grabbed()) {
              continue;
            }

            graphNode.position({
              x: physicsNode.pos.x,
              y: physicsNode.pos.y,
            });
          }
        });

        rafRef.current = window.requestAnimationFrame(syncPhysicsFrame);
      };

      if (!readOnly && adapter) {
        rafRef.current = window.requestAnimationFrame(syncPhysicsFrame);
      }

      cy.one("layoutstop", () => {
        if (cyRef.current !== cy) {
          return;
        }
        cy.resize();
        cy.fit(cy.elements(), 80);
      });

      const clearHover = () => {
        const instance = cyRef.current;
        if (!instance) {
          return;
        }
        instance.elements().removeClass("unhover hover connected-hover");
      };

      const handleNodeHover = (event: EventObject) => {
        const instance = cyRef.current;
        if (!instance || readOnly) {
          return;
        }
        if (instance.$("node:selected").length > 0) {
          return;
        }

        clearHover();

        const node = event.target as NodeSingular;
        instance.elements().addClass("unhover");
        node.closedNeighborhood().removeClass("unhover");
        node.addClass("hover");
        node.connectedEdges().addClass("connected-hover");
      };

      const handleNodeTap = (event: EventObject) => {
        const instance = cyRef.current;
        if (!instance || readOnly) {
          return;
        }
        const node = event.target as NodeSingular;
        const mouseEvent = event.originalEvent as MouseEvent | undefined;
        if (mouseEvent?.button === 2) {
          return;
        }

        const isShiftPressed = Boolean(mouseEvent?.shiftKey);
        if (isShiftPressed) {
          if (node.selected()) {
            node.unselect();
          } else {
            node.select();
          }
        } else {
          instance.nodes().unselect();
          node.select();
        }

        primaryNodeIdRef.current = node.id();
        emitSelectionState();
        setContextMenu(null);
      };

      const handleCanvasTap = (event: EventObject) => {
        const instance = cyRef.current;
        if (!instance || readOnly) {
          return;
        }
        if (event.target === instance) {
          clearSelection();
        }
        setContextMenu(null);
        clearHover();
      };

      const handleNodeOpen = (event: EventObject) => {
        const node = event.target as NodeSingular;
        const mouseEvent = event.originalEvent as MouseEvent | undefined;
        const newTab = Boolean(mouseEvent?.metaKey || mouseEvent?.ctrlKey);
        onNodeOpen?.(node.id(), { newTab });
      };

      const handleNodeContextMenu = (event: EventObject) => {
        if (readOnly) {
          return;
        }
        const node = event.target as NodeSingular;
        const rendered = event.renderedPosition;
        if (!rendered) {
          return;
        }
        setContextMenu({
          x: rendered.x,
          y: rendered.y,
          nodeId: node.id(),
        });
      };

      const handleSelectionChanged = () => {
        emitSelectionState();
      };

      const handleNodeGrab = (event: EventObject) => {
        const node = event.target as NodeSingular;
        const position = node.position();
        adapterRef.current?.onDragStart(node.id(), { x: position.x, y: position.y });
      };

      const handleNodeDrag = (event: EventObject) => {
        const node = event.target as NodeSingular;
        const position = node.position();
        adapterRef.current?.onDragMove(node.id(), { x: position.x, y: position.y });
      };

      const handleNodeFree = (event: EventObject) => {
        const node = event.target as NodeSingular;
        adapterRef.current?.onDragEnd(node.id());
      };

      if (!readOnly) {
        cy.on("mouseover", "node", handleNodeHover);
        cy.on("mouseout", "node", clearHover);
        cy.on("tap", "node", handleNodeTap);
        cy.on("tap", handleCanvasTap);
        cy.on("cxttap", "node", handleNodeContextMenu);
        cy.on("select", "node", handleSelectionChanged);
        cy.on("unselect", "node", handleSelectionChanged);
        cy.on("dbltap", "node", handleNodeOpen);
        cy.on("grab", "node", handleNodeGrab);
        cy.on("drag", "node", handleNodeDrag);
        cy.on("free", "node", handleNodeFree);
      }

      const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
        if (readOnly) {
          return;
        }
        const target = keyboardEvent.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
          return;
        }

        if (keyboardEvent.key === "Escape") {
          keyboardEvent.preventDefault();
          clearSelection();
          setContextMenu(null);
          return;
        }

        if (keyboardEvent.key === "Enter") {
          const id = primaryNodeIdRef.current;
          if (!id) {
            return;
          }
          keyboardEvent.preventDefault();
          onNodeOpen?.(id, { newTab: keyboardEvent.metaKey || keyboardEvent.ctrlKey });
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      const root = document.documentElement;
      const observer = new MutationObserver(() => {
        const instance = cyRef.current;
        if (!instance) {
          return;
        }
        instance.style(
          buildStyles(readOnly, maxNodeValue, maxEdgeWeight, getGraphThemeTokens(), showNodeLabels)
        );
      });
      observer.observe(root, {
        attributes: true,
        attributeFilter: ["class"],
      });

      const resizeObserver = new ResizeObserver(() => {
        if (cyRef.current !== cy) {
          return;
        }
        cy.resize();
      });
      resizeObserver.observe(container);

      emitSelectionState();
      emitPinnedIds();

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (!readOnly) {
          cy.off("mouseover", "node", handleNodeHover);
          cy.off("mouseout", "node", clearHover);
          cy.off("tap", "node", handleNodeTap);
          cy.off("tap", handleCanvasTap);
          cy.off("cxttap", "node", handleNodeContextMenu);
          cy.off("select", "node", handleSelectionChanged);
          cy.off("unselect", "node", handleSelectionChanged);
          cy.off("dbltap", "node", handleNodeOpen);
          cy.off("grab", "node", handleNodeGrab);
          cy.off("drag", "node", handleNodeDrag);
          cy.off("free", "node", handleNodeFree);
        }
        observer.disconnect();
        resizeObserver.disconnect();
        if (rafRef.current !== null) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        adapterRef.current = null;
        cy.destroy();
        cyRef.current = null;
      };
    }, [
      clearSelection,
      edges,
      emitPinnedIds,
      emitSelectionState,
      maxEdgeWeight,
      maxNodeValue,
      nodes,
      onNodeOpen,
      readOnly,
      showNodeLabels,
    ]);

    useEffect(() => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }

      cy.nodes().removeClass("search-match");
      if (highlightNodeIdSet.size === 0) {
        return;
      }

      for (const nodeId of highlightNodeIdSet) {
        const node = cy.$id(nodeId);
        if (!node.empty()) {
          node.addClass("search-match");
        }
      }
    }, [highlightNodeIdSet]);

    useEffect(() => {
      if (!contextMenu) {
        return;
      }
      const onClickOutside = (event: MouseEvent) => {
        const menuElement = menuRef.current;
        if (!menuElement) {
          return;
        }
        if (!menuElement.contains(event.target as Node)) {
          setContextMenu(null);
        }
      };
      window.addEventListener("mousedown", onClickOutside);
      return () => window.removeEventListener("mousedown", onClickOutside);
    }, [contextMenu]);

    const selectedCount = selectionState.selectedNodeIds.length;
    const contextNodePinned = useMemo(() => {
      if (!contextMenu) {
        return false;
      }
      const cy = cyRef.current;
      if (!cy) {
        return false;
      }
      return cy.$id(contextMenu.nodeId).hasClass("pinned");
    }, [contextMenu]);

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-background to-muted/20",
          !readOnly && "cursor-grab active:cursor-grabbing",
          className
        )}
        role="img"
        aria-label="Concept graph"
      >
        <div
          ref={containerRef}
          className={cn("h-full w-full", readOnly && "pointer-events-none")}
        />

        {!readOnly && contextMenu ? (
          <div
            ref={menuRef}
            className="absolute z-20 min-w-40 rounded-md border bg-background p-1 shadow-xl"
            style={{
              left: Math.max(8, contextMenu.x - 12),
              top: Math.max(8, contextMenu.y - 8),
            }}
          >
            <button
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                const cy = cyRef.current;
                if (!cy) {
                  return;
                }
                const node = cy.$id(contextMenu.nodeId);
                if (node.empty()) {
                  return;
                }
                if (contextNodePinned) {
                  unpinNodes([node]);
                } else {
                  pinNodes([node]);
                }
                setContextMenu(null);
              }}
            >
              {contextNodePinned ? mergedLabels.unpin : mergedLabels.pin}
            </button>

            {selectedCount > 1 ? (
              <button
                type="button"
                className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  pinSelected();
                  setContextMenu(null);
                }}
              >
                {mergedLabels.pinSelected}
              </button>
            ) : null}

            <button
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                unpinAll();
                setContextMenu(null);
              }}
            >
              {mergedLabels.unpinAll}
            </button>
          </div>
        ) : null}
      </div>
    );
  }
);
