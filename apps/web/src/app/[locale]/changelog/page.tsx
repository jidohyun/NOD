import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalHeader } from "@/components/legal/legal-header";

interface ChangelogPageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: "Release Notes — NOD",
  robots: { index: true, follow: true },
};

export default async function ChangelogPage({ params }: ChangelogPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("changelogPage");
  const versionIds = ["v1_3_0", "v1_2_0", "v1_1_0", "v1_0_0"] as const;
  const highlightIds = ["item1", "item2", "item3", "item4"] as const;

  const getVersionHighlights = (versionId: (typeof versionIds)[number]) => {
    return highlightIds.map((highlightId) => ({
      title: t(`versions.${versionId}.highlights.${highlightId}.title`),
      description: t(`versions.${versionId}.highlights.${highlightId}.description`),
    }));
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <LegalHeader />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-cm-text/10 bg-white/80 p-4 md:sticky md:top-24 dark:bg-cm-surface/80">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sections.versionListTitle")}
          </h2>
          <nav className="mt-3 space-y-1">
            {versionIds.map((versionId) => (
              <a
                key={versionId}
                href={`#${versionId}`}
                className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-cm-bg"
              >
                {t(`versions.${versionId}.label`)}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          {versionIds.map((versionId) => {
            const highlights = getVersionHighlights(versionId);

            return (
              <section
                id={versionId}
                key={versionId}
                className="scroll-mt-24 rounded-2xl border border-cm-text/12 bg-white/80 p-6 dark:bg-cm-surface/80"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{t(`versions.${versionId}.label`)}</h2>
                  <span className="rounded-full border border-cm-text/15 px-2 py-0.5 text-xs text-muted-foreground">
                    {t(`versions.${versionId}.status`)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`versions.${versionId}.tagLabel`)}: {t(`versions.${versionId}.tag`)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(`versions.${versionId}.publishedAtLabel`)}:{" "}
                  {t(`versions.${versionId}.publishedAt`)}
                </p>
                <p className="mt-4 text-sm leading-6">{t(`versions.${versionId}.summary`)}</p>

                <h3 className="mt-5 text-sm font-semibold">
                  {t(`versions.${versionId}.highlightsTitle`)}
                </h3>
                <ul className="mt-3 space-y-2">
                  {highlights.map((highlight) => (
                    <li
                      key={highlight.title}
                      className="rounded-xl border border-cm-text/10 px-4 py-3"
                    >
                      <p className="text-sm font-semibold">{highlight.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{highlight.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <a
          href="https://github.com/jidohyun/NOD/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-cm-text/20 px-4 py-2 font-medium transition-colors hover:bg-cm-bg"
        >
          {t("links.githubReleases")}
        </a>
        <a
          href="/dashboard"
          className="inline-flex items-center rounded-lg bg-nod-gold px-4 py-2 font-medium text-black transition-colors hover:bg-[#f0c958]"
        >
          {t("links.backToDashboard")}
        </a>
      </div>
    </main>
  );
}
