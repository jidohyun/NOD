import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <OnboardingFlow />;
}
