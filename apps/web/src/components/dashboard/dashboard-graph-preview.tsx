"use client";

import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConceptGraphCanvas } from "@/components/dashboard/concept-graph-canvas";
import { useConceptGraph } from "@/lib/api/articles";
import { Link } from "@/lib/i18n/routing";

interface DashboardGraphPreviewProps {
  isPro: boolean;
  usageLoading: boolean;
}

export function DashboardGraphPreview({ isPro, usageLoading }: DashboardGraphPreviewProps) {
  const t = useTranslations("dashboard.graph");
  const { data, isLoading, isError } = useConceptGraph({
    maxNodes: 1000,
    enabled: isPro,
  });

  if (usageLoading) {
    return <div className="h-80 animate-pulse rounded-xl border bg-card" />;
  }

  if (!isPro) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t("lockedTitle")}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("lockedDescription")}</p>
        <Link
          href="/pricing"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("upgrade")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-nod-gold" />
            <h3 className="font-semibold">{t("previewTitle")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t("previewDescription")}</p>
        </div>
        <Link
          href="/dashboard/graph"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {t("openFull")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? <div className="h-72 animate-pulse rounded-xl border bg-muted/40" /> : null}

      {!isLoading && isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {t("loadError")}
        </div>
      ) : null}

      {!isLoading && !isError && data ? (
        <>
          {data.nodes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <ConceptGraphCanvas nodes={data.nodes} edges={data.edges} readOnly className="h-72" />
          )}

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">{t("statsArticles")}</div>
              <div className="font-semibold">{data.meta.total_articles}</div>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">{t("statsConcepts")}</div>
              <div className="font-semibold">{data.meta.total_unique_concepts}</div>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">{t("statsNodes")}</div>
              <div className="font-semibold">{data.meta.returned_nodes}</div>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">{t("statsEdges")}</div>
              <div className="font-semibold">{data.meta.returned_edges}</div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
