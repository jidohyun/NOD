import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalHeader } from "@/components/legal/legal-header";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("legal.privacy");
  const s = await getTranslations("legal.privacy.sections");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <LegalHeader />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("effectiveDate")}</p>
      </header>

      <div className="mt-8 space-y-8 text-sm leading-6">
        <section className="space-y-2">
          <p>{t("intro")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("collection.title")}</h2>
          <p>{s("collection.content")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{s("collection.items.account")}</li>
            <li>{s("collection.items.content")}</li>
            <li>{s("collection.items.usage")}</li>
            <li>{s("collection.items.payment")}</li>
            <li>{s("collection.items.analytics")}</li>
          </ul>
          <p className="text-muted-foreground">{s("collection.note")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("purpose.title")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{s("purpose.items.auth")}</li>
            <li>{s("purpose.items.core")}</li>
            <li>{s("purpose.items.billing")}</li>
            <li>{s("purpose.items.improve")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("sharing.title")}</h2>
          <p>{s("sharing.content")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{s("sharing.items.cloud")}</li>
            <li>{s("sharing.items.auth")}</li>
            <li>{s("sharing.items.ai")}</li>
            <li>{s("sharing.items.payment")}</li>
            <li>{s("sharing.items.analytics")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("retention.title")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{s("retention.items.principle")}</li>
            <li>{s("retention.items.deletion")}</li>
            <li>{s("retention.items.legal")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("rights.title")}</h2>
          <p>{s("rights.content")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("cookies.title")}</h2>
          <p>{s("cookies.content")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("security.title")}</h2>
          <p>{s("security.content")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("contact.title")}</h2>
          <p className="whitespace-pre-line">{s("contact.content")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{s("changes.title")}</h2>
          <p>{s("changes.content")}</p>
        </section>
      </div>
    </main>
  );
}
