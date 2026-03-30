import Link from "next/link";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface NotFoundPageProps {
  params?: Promise<{ locale: string }>;
}

export default async function NotFoundPage({ params }: NotFoundPageProps) {
  const locale = (await params)?.locale || "en";
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "errors" });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24">
      <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">404</h1>
      <p className="mt-4 text-muted-foreground">{t("notFound")}</p>
      <Link
        href={`/${locale}`}
        className="mt-8 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("goHome")}
      </Link>
    </main>
  );
}
