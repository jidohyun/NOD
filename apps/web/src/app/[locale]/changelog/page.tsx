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

  const highlights = [
    {
      title: t("highlights.shareRoutingTitle"),
      description: t("highlights.shareRoutingDescription"),
    },
    {
      title: t("highlights.publicPageTitle"),
      description: t("highlights.publicPageDescription"),
    },
    {
      title: t("highlights.commentsTitle"),
      description: t("highlights.commentsDescription"),
    },
    {
      title: t("highlights.shareControlsTitle"),
      description: t("highlights.shareControlsDescription"),
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <LegalHeader />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <section className="mt-8 rounded-2xl border border-cm-text/12 bg-white/80 p-6 dark:bg-cm-surface/80">
        <p className="text-xs font-semibold uppercase tracking-wide text-nod-gold">
          {t("latest.badge")}
        </p>
        <h2 className="mt-2 text-xl font-bold">{t("latest.version")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("latest.publishedAtLabel")}: {t("latest.publishedAt")}
        </p>
        <p className="mt-4 text-sm leading-6">{t("latest.summary")}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold">{t("sections.highlightsTitle")}</h2>
        <ul className="space-y-2">
          {highlights.map((highlight) => (
            <li key={highlight.title} className="rounded-xl border border-cm-text/10 px-4 py-3">
              <p className="text-sm font-semibold">{highlight.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{highlight.description}</p>
            </li>
          ))}
        </ul>
      </section>

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
