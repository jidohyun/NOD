interface Props {
  metadata: Record<string, unknown>;
}

export function VideoPodcastMetadata({ metadata }: Props) {
  const timestamps = (metadata.timestamps as string[]) || [];
  const speakers = (metadata.speakers as string[]) || [];
  const transcriptHighlights = (metadata.transcript_highlights as string[]) || [];

  const hasContent =
    timestamps.length > 0 || speakers.length > 0 || transcriptHighlights.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {speakers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {speakers.map((speaker) => (
            <span
              key={speaker}
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {speaker}
            </span>
          ))}
        </div>
      )}
      {timestamps.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Timeline</h4>
          <ul className="space-y-0.5">
            {timestamps.map((ts) => (
              <li key={ts} className="text-sm font-mono">
                {ts}
              </li>
            ))}
          </ul>
        </div>
      )}
      {transcriptHighlights.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Highlights</h4>
          <ul className="space-y-1">
            {transcriptHighlights.map((highlight) => (
              <li key={highlight} className="text-sm italic border-l-2 border-primary/30 pl-2">
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
