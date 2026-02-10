"use client";

import { Link2, Lock, Network, PinOff, Search, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import {
  ConceptGraphCanvas,
  type ConceptGraphCanvasHandle,
  type GraphSelectionState,
} from "@/components/dashboard/concept-graph-canvas";
import { useConceptGraph } from "@/lib/api/articles";
import { useUsage } from "@/lib/api/subscriptions";
import { Link, useRouter } from "@/lib/i18n/routing";

type ScopeMode = "global" | "local";

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export function DashboardGraphView() {
  const t = useTranslations("dashboard.graph");
  const router = useRouter();
  const graphRef = useRef<ConceptGraphCanvasHandle | null>(null);

  const { data: usage, isLoading: usageLoading } = useUsage();
  const isPro = usage?.plan === "pro";
  const { data, isLoading, isError } = useConceptGraph({
    maxNodes: 1000,
    enabled: isPro,
  });

  const [scopeMode, setScopeMode] = useState<ScopeMode>("global");
  const [depthDraft, setDepthDraft] = useState(2);
  const [depthApplied, setDepthApplied] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [minConnections, setMinConnections] = useState(0);
  const [selection, setSelection] = useState<GraphSelectionState>({
    selectedNodeIds: [],
    primaryNodeId: null,
  });
  const [pinnedNodeIds, setPinnedNodeIds] = useState<string[]>([]);
  const [localCenterNodeId, setLocalCenterNodeId] = useState<string | null>(null);

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const node of nodes) {
      map.set(node.id, new Set<string>());
    }
    for (const edge of edges) {
      if (!map.has(edge.source) || !map.has(edge.target)) {
        continue;
      }
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    }
    return map;
  }, [edges, nodes]);

  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const [nodeId, neighbors] of adjacency.entries()) {
      map.set(nodeId, neighbors.size);
    }
    return map;
  }, [adjacency]);

  const filteredSet = useMemo(() => {
    return new Set(
      nodes.filter((node) => (degreeMap.get(node.id) ?? 0) >= minConnections).map((node) => node.id)
    );
  }, [degreeMap, minConnections, nodes]);

  const localCenterFilteredOut =
    scopeMode === "local" &&
    Boolean(localCenterNodeId) &&
    !filteredSet.has(localCenterNodeId as string);

  const localVisibleSet = useMemo(() => {
    if (scopeMode !== "local") {
      return filteredSet;
    }
    if (!localCenterNodeId || localCenterFilteredOut || !filteredSet.has(localCenterNodeId)) {
      return new Set<string>();
    }

    const visited = new Set<string>([localCenterNodeId]);
    let frontier = new Set<string>([localCenterNodeId]);
    for (let i = 0; i < depthApplied; i += 1) {
      const nextFrontier = new Set<string>();
      for (const nodeId of frontier) {
        const neighbors = adjacency.get(nodeId) ?? new Set<string>();
        for (const neighbor of neighbors) {
          if (!filteredSet.has(neighbor) || visited.has(neighbor)) {
            continue;
          }
          visited.add(neighbor);
          nextFrontier.add(neighbor);
        }
      }
      frontier = nextFrontier;
      if (frontier.size === 0) {
        break;
      }
    }
    return visited;
  }, [adjacency, depthApplied, filteredSet, localCenterFilteredOut, localCenterNodeId, scopeMode]);

  const visibleSet = scopeMode === "local" ? localVisibleSet : filteredSet;

  const visibleNodes = useMemo(
    () => nodes.filter((node) => visibleSet.has(node.id)),
    [nodes, visibleSet]
  );
  const visibleNodeIdSet = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes]
  );
  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (edge) => visibleNodeIdSet.has(edge.source) && visibleNodeIdSet.has(edge.target)
      ),
    [edges, visibleNodeIdSet]
  );

  const normalizedQuery = normalizeQuery(searchQuery);
  const searchMatches = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }
    return visibleNodes.filter((node) => normalizeQuery(node.label).includes(normalizedQuery));
  }, [normalizedQuery, visibleNodes]);

  const searchHighlightNodeIds = searchMatches.map((node) => node.id);
  const primaryNode = selection.primaryNodeId
    ? (nodeMap.get(selection.primaryNodeId) ?? null)
    : null;

  if (usageLoading) {
    return <div className="h-[70vh] animate-pulse rounded-xl border bg-card" />;
  }

  if (!isPro) {
    return (
      <div className="rounded-xl border bg-card p-8">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t("lockedTitle")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("lockedDescription")}</p>
        <Link
          href="/pricing"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("upgrade")}
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-nod-gold">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">{t("sectionLabel")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("pageDescription")}</p>
      </header>

      <div className="rounded-xl border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded-md border px-3 py-1.5 text-sm ${scopeMode === "global" ? "bg-accent" : "hover:bg-accent"}`}
            onClick={() => setScopeMode("global")}
          >
            {t("modeGlobal")}
          </button>
          <button
            type="button"
            className={`rounded-md border px-3 py-1.5 text-sm ${scopeMode === "local" ? "bg-accent" : "hover:bg-accent"}`}
            onClick={() => {
              if (!selection.primaryNodeId) {
                return;
              }
              setLocalCenterNodeId(selection.primaryNodeId);
              setScopeMode("local");
            }}
            disabled={!selection.primaryNodeId}
          >
            {t("modeLocal")}
          </button>

          {scopeMode === "local" ? (
            <div className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t("depthLabel")}</span>
              <input
                type="range"
                min={1}
                max={4}
                value={depthDraft}
                onChange={(event) => setDepthDraft(Number(event.target.value))}
                onMouseUp={() => setDepthApplied(depthDraft)}
                onTouchEnd={() => setDepthApplied(depthDraft)}
              />
              <span>{depthDraft}</span>
            </div>
          ) : null}

          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            onClick={() => graphRef.current?.unpinAll()}
          >
            <PinOff className="h-4 w-4" />
            {t("actionUnpinAll")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("panelSearch")}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-nod-gold/30"
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-auto">
              {searchMatches.slice(0, 20).map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                  onClick={() => graphRef.current?.selectSingle(node.id)}
                >
                  {node.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("panelFilters")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("filterMinConnections")}: {minConnections}
            </div>
            <input
              type="range"
              min={0}
              max={8}
              value={minConnections}
              onChange={(event) => setMinConnections(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </div>
        </aside>

        <div className="relative rounded-xl border bg-card p-3">
          {isLoading ? (
            <div className="h-[68vh] animate-pulse rounded-xl border bg-muted/40" />
          ) : null}

          {!isLoading && isError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {t("loadError")}
            </div>
          ) : null}

          {!isLoading && !isError ? (
            visibleNodes.length > 0 ? (
              <ConceptGraphCanvas
                ref={graphRef}
                nodes={visibleNodes}
                edges={visibleEdges}
                className="h-[68vh]"
                highlightNodeIds={searchHighlightNodeIds}
                onSelectionChange={setSelection}
                onPinnedNodeIdsChange={setPinnedNodeIds}
                onNodeOpen={(nodeId, options) => {
                  const nodeLabel = nodeMap.get(nodeId)?.label ?? "";
                  const target = `/articles?search=${encodeURIComponent(nodeLabel)}`;
                  if (options.newTab) {
                    window.open(target, "_blank", "noopener,noreferrer");
                    return;
                  }
                  router.push(target);
                }}
                labels={{
                  pin: t("menuPin"),
                  unpin: t("menuUnpin"),
                  unpinAll: t("menuUnpinAll"),
                  pinSelected: t("menuPinSelected"),
                }}
              />
            ) : (
              <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
                {t("empty")}
              </div>
            )
          ) : null}

          {scopeMode === "local" && localCenterFilteredOut ? (
            <div className="absolute inset-3 flex flex-col items-center justify-center gap-3 rounded-xl border bg-background/95 p-6 text-center">
              <p className="text-sm text-muted-foreground">{t("localCenterFilteredMessage")}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => {
                    if (selection.primaryNodeId) {
                      setLocalCenterNodeId(selection.primaryNodeId);
                    }
                  }}
                >
                  {t("localReselectBase")}
                </button>
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setScopeMode("global")}
                >
                  {t("localSwitchGlobal")}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("panelSelection")}
            </div>
            <p className="text-sm text-muted-foreground">
              {selection.selectedNodeIds.length > 0
                ? t("selectionCount", { count: selection.selectedNodeIds.length })
                : t("selectionEmpty")}
            </p>
          </div>

          {primaryNode ? (
            <div className="space-y-3 rounded-lg border p-3">
              <h3 className="text-sm font-semibold">{primaryNode.label}</h3>
              <div className="grid gap-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>{t("statsNodes")}</span>
                  <span>{primaryNode.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("statsEdges")}</span>
                  <span>{degreeMap.get(primaryNode.id) ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("selectionPinned")}</span>
                  <span>{pinnedNodeIds.includes(primaryNode.id) ? t("yes") : t("no")}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-md border px-2 py-1.5 text-xs hover:bg-accent"
                  onClick={() => graphRef.current?.pinSelected()}
                >
                  {t("actionPinSelected")}
                </button>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1.5 text-xs hover:bg-accent"
                  onClick={() => graphRef.current?.unpinSelected()}
                >
                  {t("actionUnpinSelected")}
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="w-full rounded-md border px-3 py-2 text-sm hover:bg-accent"
            onClick={() => graphRef.current?.clearSelection()}
          >
            {t("actionClearSelection")}
          </button>

          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Network className="h-3 w-3" />
                {t("statsNodes")}
              </div>
              <div className="font-semibold">{data?.meta.returned_nodes ?? 0}</div>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Link2 className="h-3 w-3" />
                {t("statsEdges")}
              </div>
              <div className="font-semibold">{data?.meta.returned_edges ?? 0}</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
