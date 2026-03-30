import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getChangelogVersions } from "@/app/[locale]/changelog/changelog-content";
import { ChangelogVersionBrowser } from "@/components/changelog/changelog-version-browser";
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
  const versions = getChangelogVersions(t, locale);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <LegalHeader />

      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <ChangelogVersionBrowser
        versions={versions}
        versionListTitle={t("sections.versionListTitle")}
      />

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
          href={`/${locale}/dashboard`}
          className="inline-flex items-center rounded-lg bg-nod-gold px-4 py-2 font-medium text-black transition-colors hover:bg-[#f0c958]"
        >
          {t("links.backToDashboard")}
        </a>
      </div>
    </main>
  );
}
