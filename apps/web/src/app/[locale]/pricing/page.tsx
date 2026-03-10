import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LandingPricing } from "@/components/landing/pricing";
import { locales } from "@/lib/i18n/config";

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

const pricingTitles: Record<string, string> = {
  ko: "NOD 요금제 — 무료 플랜 & Pro 플랜 비교",
  en: "NOD Pricing — Free & Pro Plans Compared",
  ja: "NOD料金プラン — 無料 & Proプラン比較",
  es: "Precios de NOD — Planes Free y Pro",
  "pt-BR": "Preços NOD — Planos Free e Pro",
  "zh-CN": "NOD定价 — 免费和Pro套餐对比",
  de: "NOD Preise — Free & Pro Pläne im Vergleich",
  fr: "Tarifs NOD — Plans Free et Pro comparés",
};

const pricingDescriptions: Record<string, string> = {
  ko: "NOD의 무료 플랜과 Pro 플랜을 비교하세요. AI 아티클 요약, 시맨틱 검색, 무제한 저장 기능을 월 $5로 이용하세요.",
  en: "Compare NOD Free and Pro plans. Get AI article summaries, semantic search, and unlimited storage starting at $5/month.",
  ja: "NODの無料プランとProプランを比較。AI記事要約、セマンティック検索、無制限ストレージを月額$5から。",
  es: "Compare los planes Free y Pro de NOD. Resúmenes IA, búsqueda semántica y almacenamiento ilimitado desde $5/mes.",
  "pt-BR":
    "Compare os planos Free e Pro do NOD. Resumos IA, busca semântica e armazenamento ilimitado a partir de $5/mês.",
  "zh-CN": "比较NOD免费和Pro套餐。AI文章摘要、语义搜索和无限存储，每月仅需$5起。",
  de: "Vergleichen Sie die Free- und Pro-Pläne von NOD. KI-Zusammenfassungen, semantische Suche und unbegrenzter Speicher ab $5/Monat.",
  fr: "Comparez les plans Free et Pro de NOD. Résumés IA, recherche sémantique et stockage illimité à partir de 5$/mois.",
};

export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const title = pricingTitles[locale] || pricingTitles.en;
  const description = pricingDescriptions[locale] || pricingDescriptions.en;
  return {
    title,
    description,
    alternates: {
      canonical: "/pricing",
      languages: Object.fromEntries(
        locales.map((l) => [l, l === "ko" ? "/pricing" : `/${l}/pricing`])
      ),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/pricing",
      locale: locale,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <LandingPricing />;
}
