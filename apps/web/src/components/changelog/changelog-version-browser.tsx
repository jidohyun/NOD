import type { ChangelogVersion } from "@/app/[locale]/changelog/changelog-content";

interface ChangelogVersionBrowserProps {
  versions: ChangelogVersion[];
  versionListTitle: string;
}

export function ChangelogVersionBrowser({
  versions,
  versionListTitle,
}: ChangelogVersionBrowserProps) {
  const selectedVersion = versions[0];

  if (!selectedVersion) {
    return null;
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-cm-text/10 bg-white/80 p-4 md:sticky md:top-24 dark:bg-cm-surface/80">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {versionListTitle}
        </h2>
        <nav className="mt-3 space-y-1" aria-label={versionListTitle}>
          {versions.map((version) => {
            const isSelected = version.id === selectedVersion.id;

            return (
              <a
                key={version.id}
                href={version.detailHref}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-cm-bg text-foreground"
                    : "text-muted-foreground hover:bg-cm-bg hover:text-foreground"
                }`}
              >
                {version.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <section
        className="rounded-2xl border border-cm-text/12 bg-white/80 p-6 dark:bg-cm-surface/80"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">{selectedVersion.label}</h2>
          <span className="rounded-full border border-cm-text/15 px-2 py-0.5 text-xs text-muted-foreground">
            {selectedVersion.status}
          </span>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {selectedVersion.tagLabel}: {selectedVersion.tag}
        </p>
        <p className="text-sm text-muted-foreground">
          {selectedVersion.publishedAtLabel}: {selectedVersion.publishedAt}
        </p>

        <p className="mt-4 text-sm leading-6 whitespace-pre-line">{selectedVersion.summary}</p>

        <h3 className="mt-5 text-sm font-semibold">{selectedVersion.highlightsTitle}</h3>
        <ul className="mt-3 space-y-2">
          {selectedVersion.highlights.map((highlight) => (
            <li key={highlight.title} className="rounded-xl border border-cm-text/10 px-4 py-3">
              <p className="text-sm font-semibold">{highlight.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{highlight.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
