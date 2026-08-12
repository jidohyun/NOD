interface Props {
  metadata: Record<string, unknown>;
}

function MetadataList({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "warning";
}) {
  if (items.length === 0) return null;

  const itemClassName =
    tone === "warning" ? "text-sm text-orange-800 dark:text-orange-300" : "text-sm";

  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">{title}</h4>
      <ul className="list-disc list-inside space-y-1">
        {items.map((item) => (
          <li key={item} className={itemClassName}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DiscussionMetadata({ metadata }: Props) {
  const centralQuestion = (metadata.central_question as string) || "";
  const insiderTakeaways = (metadata.insider_takeaways as string[]) || [];
  const disagreementPoints = (metadata.disagreement_points as string[]) || [];
  const evidenceSignals = (metadata.evidence_signals as string[]) || [];

  const hasContent =
    centralQuestion ||
    insiderTakeaways.length > 0 ||
    disagreementPoints.length > 0 ||
    evidenceSignals.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {centralQuestion ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-2.5 dark:border-orange-900/80 dark:bg-orange-950/30">
          <h4 className="text-xs font-semibold text-orange-700 uppercase mb-1 dark:text-orange-300">
            Central Question
          </h4>
          <p className="text-sm leading-relaxed text-orange-950 dark:text-orange-100">
            {centralQuestion}
          </p>
        </div>
      ) : null}

      <MetadataList title="Insider Takeaways" items={insiderTakeaways} />
      <MetadataList title="Main Disagreements" items={disagreementPoints} tone="warning" />
      <MetadataList title="Evidence Signals" items={evidenceSignals} />
    </div>
  );
}
