import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PricingContent } from "@/components/subscription/pricing-content";

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <PricingContent />;
}
