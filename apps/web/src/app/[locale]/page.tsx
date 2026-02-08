import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LandingCta } from "@/components/landing/cta";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { LandingFeatures } from "@/components/landing/features";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingNav } from "@/components/landing/nav";

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
