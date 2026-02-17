interface Props {
  metadata: Record<string, unknown>;
}

export function OfficialDocsMetadata({ metadata }: Props) {
  const apiHighlights = (metadata.api_highlights as string[]) || [];
  const versionInfo = (metadata.version_info as string) || "";
  const prerequisites = (metadata.prerequisites as string[]) || [];
  const relatedTopics = (metadata.related_topics as string[]) || [];

  const hasContent =
    apiHighlights.length > 0 || versionInfo || prerequisites.length > 0 || relatedTopics.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {versionInfo ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Version:</span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {versionInfo}
          </span>
        </div>
      ) : null}
      {apiHighlights.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            API Highlights
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {apiHighlights.map((api) => (
              <code key={api} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
                {api}
              </code>
            ))}
          </div>
        </div>
      )}
      {prerequisites.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Prerequisites
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {prerequisites.map((prereq) => (
              <li key={prereq} className="text-sm">
                {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}
      {relatedTopics.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Related Topics
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {relatedTopics.map((topic) => (
              <span key={topic} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
