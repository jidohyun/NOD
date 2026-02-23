import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LandingCta } from "@/components/landing/cta";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { LandingFeatures } from "@/components/landing/features";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingNav } from "@/components/landing/nav";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingStackingCards } from "@/components/landing/stacking-cards";
import { LandingSvgAutoCursor } from "@/components/landing/svg-auto-cursor";
import { LandingTypewriterFeed } from "@/components/landing/typewriter-feed";
import { SoftwareApplicationJsonLd } from "@/components/seo/json-ld";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="dark grain-overlay">
      <SoftwareApplicationJsonLd />
      <LandingSvgAutoCursor />
      <LandingNav />
      <main>
        <LandingHero />
        <LandingTypewriterFeed />
        <LandingFeatures />
        <LandingStackingCards />
        <LandingHowItWorks />
        <DashboardPreview />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
