import type { Metadata } from "next";
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
import {
  BreadcrumbJsonLd,
  OrganizationJsonLd,
  PersonJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
} from "@/components/seo/json-ld";
import { locales } from "@/lib/i18n/config";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const titles: Record<string, string> = {
  ko: "NOD — AI 기반 나만의 세컨드 브레인",
  en: "NOD — Your AI-Powered Second Brain",
  ja: "NOD — AIで実現するセカンドブレイン",
  es: "NOD — Tu segundo cerebro potenciado por IA",
  "pt-BR": "NOD — Seu segundo cérebro com IA",
  "zh-CN": "NOD — AI驱动的第二大脑",
  de: "NOD — Dein KI-gestütztes zweites Gehirn",
  fr: "NOD — Votre second cerveau propulsé par l'IA",
};

const descriptions: Record<string, string> = {
  ko: "기술 아티클을 저장하고, AI 요약을 받고, 시맨틱 유사도 검색으로 관련 지식을 발견하세요. 당신만의 지식 엔진.",
  en: "Save technical articles, get AI summaries, and discover related knowledge through semantic similarity search. Your personal knowledge engine.",
  ja: "技術記事を保存し、AI要約を取得し、セマンティック検索で関連知識を発見しましょう。あなたのパーソナルナレッジエンジン。",
  es: "Guarda artículos técnicos, obtén resúmenes con IA y descubre conocimiento relacionado con búsqueda semántica.",
  "pt-BR":
    "Salve artigos técnicos, obtenha resumos com IA e descubra conhecimento relacionado com busca semântica.",
  "zh-CN": "保存技术文章，获取AI摘要，通过语义搜索发现相关知识。您的个人知识引擎。",
  de: "Speichere Fachartikel, erhalte KI-Zusammenfassungen und entdecke verwandtes Wissen durch semantische Suche.",
  fr: "Sauvegardez des articles techniques, obtenez des résumés IA et découvrez des connaissances connexes par recherche sémantique.",
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const title = titles[locale] || titles.en;
  const description = descriptions[locale] || descriptions.en;
  return {
    title,
    description,
    alternates: {
      canonical: "/",
      languages: Object.fromEntries(locales.map((l) => [l, l === "ko" ? "/" : `/${l}`])),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="bg-cm-bg font-creative-body text-cm-text selection:bg-nod-gold selection:text-white overflow-x-hidden">
      <WebSiteJsonLd />
      <SoftwareApplicationJsonLd />
      <OrganizationJsonLd />
      <PersonJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "https://nod-archive.com" }]} />
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <DashboardPreview />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
