interface Props {
  metadata: Record<string, unknown>;
}

export function GeneralNewsMetadata({ metadata }: Props) {
  const sentiment = (metadata.sentiment as string) || "";
  const biasIndicators = (metadata.bias_indicators as string[]) || [];
  const factCheckNotes = (metadata.fact_check_notes as string[]) || [];

  const hasContent = sentiment || biasIndicators.length > 0 || factCheckNotes.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {sentiment ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sentiment:</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              sentiment === "positive"
                ? "bg-green-100 text-green-800"
                : sentiment === "negative"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {sentiment}
          </span>
        </div>
      ) : null}
      {biasIndicators.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Bias Indicators
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {biasIndicators.map((indicator) => (
              <li key={indicator} className="text-sm">
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}
      {factCheckNotes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Fact Check Notes
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {factCheckNotes.map((note) => (
              <li key={note} className="text-sm">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
