interface Props {
  metadata: Record<string, unknown>;
}

export function AcademicPaperMetadata({ metadata }: Props) {
  const abstract = (metadata.abstract as string) || "";
  const methodology = (metadata.methodology as string) || "";
  const findings = (metadata.findings as string[]) || [];
  const limitations = (metadata.limitations as string[]) || [];

  const hasContent = abstract || methodology || findings.length > 0 || limitations.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {abstract ? (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Abstract</h4>
          <p className="text-sm leading-relaxed">{abstract}</p>
        </div>
      ) : null}
      {methodology ? (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Methodology
          </h4>
          <p className="text-sm leading-relaxed">{methodology}</p>
        </div>
      ) : null}
      {findings.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Key Findings
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {findings.map((finding) => (
              <li key={finding} className="text-sm">
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}
      {limitations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Limitations
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {limitations.map((limitation) => (
              <li key={limitation} className="text-sm">
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
