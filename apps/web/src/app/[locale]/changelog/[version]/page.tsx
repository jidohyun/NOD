import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getChangelogVersions } from "@/app/[locale]/changelog/changelog-content";
import { LegalHeader } from "@/components/legal/legal-header";

interface ChangelogVersionDetailPageProps {
  params: Promise<{ locale: string; version: string }>;
}

export default async function ChangelogVersionDetailPage({
  params,
}: ChangelogVersionDetailPageProps) {
  const { locale, version } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("changelogPage");
  const common = await getTranslations("common");
  const versions = getChangelogVersions(t, locale);

  const selectedVersion = versions.find((item) => item.slug === version);

  if (!selectedVersion) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <LegalHeader />

      <header className="space-y-2">
        <a
          href={`/${locale}/changelog`}
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {common("back")}
        </a>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{selectedVersion.label}</h1>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-cm-text/10 bg-white/80 p-4 md:sticky md:top-24 dark:bg-cm-surface/80">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sections.versionListTitle")}
          </h2>
          <nav className="mt-3 space-y-1" aria-label={t("sections.versionListTitle")}>
            {versions.map((item) => {
              const isSelected = item.slug === selectedVersion.slug;

              return (
                <a
                  key={item.id}
                  href={item.detailHref}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-cm-bg text-foreground"
                      : "text-muted-foreground hover:bg-cm-bg hover:text-foreground"
                  }`}
                  aria-current={isSelected ? "page" : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-2xl border border-cm-text/12 bg-white/80 p-6 dark:bg-cm-surface/80">
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

          {selectedVersion.patchNotes ? (
            <div className="mt-5 rounded-xl border border-cm-text/10 bg-cm-bg/40 px-4 py-3">
              <p className="text-sm leading-6 whitespace-pre-line">{selectedVersion.patchNotes}</p>
            </div>
          ) : null}

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
    </main>
  );
}
