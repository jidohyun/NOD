interface Props {
  metadata: Record<string, unknown>;
}

export function GitHubRepoMetadata({ metadata }: Props) {
  const techStack = (metadata.tech_stack as string[]) || [];
  const architectureOverview = (metadata.architecture_overview as string) || "";
  const gettingStarted = (metadata.getting_started as string) || "";
  const useCases = (metadata.use_cases as string[]) || [];

  const hasContent =
    techStack.length > 0 || architectureOverview || gettingStarted || useCases.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
            >
              {tech}
            </span>
          ))}
        </div>
      )}
      {architectureOverview ? (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Architecture
          </h4>
          <p className="text-sm leading-relaxed">{architectureOverview}</p>
        </div>
      ) : null}
      {gettingStarted ? (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Getting Started
          </h4>
          <p className="text-sm leading-relaxed">{gettingStarted}</p>
        </div>
      ) : null}
      {useCases.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Use Cases</h4>
          <ul className="list-disc list-inside space-y-0.5">
            {useCases.map((useCase) => (
              <li key={useCase} className="text-sm">
                {useCase}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
