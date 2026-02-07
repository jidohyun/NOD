import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import {
  DashboardPreview,
  LandingCta,
  LandingFeatures,
  LandingFooter,
  LandingHero,
  LandingHowItWorks,
  LandingNav,
} from "@/components/landing";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="grain-overlay">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <DashboardPreview />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
