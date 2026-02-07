import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { BillingContent } from "@/components/subscription/billing-content";

interface BillingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <BillingContent />
    </div>
  );
}
