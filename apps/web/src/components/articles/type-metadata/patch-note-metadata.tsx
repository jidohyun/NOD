interface Props {
  metadata: Record<string, unknown>;
}

function MetadataList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">{title}</h4>
      <ul className="list-disc list-inside space-y-0.5">
        {items.map((item) => (
          <li key={item} className="text-sm">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PatchNoteMetadata({ metadata }: Props) {
  const version = (metadata.version as string) || "";
  const newFeatures = (metadata.new_features as string[]) || [];
  const bugFixes = (metadata.bug_fixes as string[]) || [];
  const improvements = (metadata.improvements as string[]) || [];
  const breakingChanges = (metadata.breaking_changes as string[]) || [];

  const hasContent =
    version ||
    newFeatures.length > 0 ||
    bugFixes.length > 0 ||
    improvements.length > 0 ||
    breakingChanges.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {version ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Version:</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            {version}
          </span>
        </div>
      ) : null}
      <MetadataList title="New Features" items={newFeatures} />
      <MetadataList title="Bug Fixes" items={bugFixes} />
      <MetadataList title="Improvements" items={improvements} />
      {breakingChanges.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-red-600 uppercase mb-1 dark:text-red-400">
            Breaking Changes
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {breakingChanges.map((item) => (
              <li key={item} className="text-sm text-red-700 dark:text-red-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
