import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { locales } from "@/lib/i18n/config";

interface BlogIndexProps {
  params: Promise<{ locale: string }>;
}

const blogTitles: Record<string, string> = {
  ko: "NOD 블로그 — AI 지식 관리 인사이트",
  en: "NOD Blog — AI Knowledge Management Insights",
  ja: "NODブログ — AIナレッジ管理インサイト",
  es: "Blog NOD — Perspectivas de gestión del conocimiento con IA",
  "pt-BR": "Blog NOD — Insights de gestão de conhecimento com IA",
  "zh-CN": "NOD博客 — AI知识管理洞察",
  de: "NOD Blog — KI-Wissensmanagement Insights",
  fr: "Blog NOD — Perspectives de gestion des connaissances IA",
};

const blogDescriptions: Record<string, string> = {
  ko: "AI 아티클 요약, 시맨틱 검색, 지식 관리에 관한 최신 가이드와 비교 분석을 확인하세요.",
  en: "Explore guides and comparisons on AI article summarization, semantic search, and knowledge management.",
  ja: "AI記事要約、セマンティック検索、ナレッジ管理に関する最新ガイドと比較をご覧ください。",
  es: "Explore guías y comparaciones sobre resumen de artículos con IA, búsqueda semántica y gestión del conocimiento.",
  "pt-BR":
    "Explore guias e comparações sobre resumo de artigos com IA, busca semântica e gestão do conhecimento.",
  "zh-CN": "探索关于AI文章摘要、语义搜索和知识管理的最新指南和对比分析。",
  de: "Entdecken Sie Leitfäden und Vergleiche zu KI-Artikelzusammenfassung, semantischer Suche und Wissensmanagement.",
  fr: "Explorez des guides et comparaisons sur le résumé d'articles IA, la recherche sémantique et la gestion des connaissances.",
};

export async function generateMetadata({ params }: BlogIndexProps): Promise<Metadata> {
  const { locale } = await params;
  const title = blogTitles[locale] || blogTitles.en;
  const description = blogDescriptions[locale] || blogDescriptions.en;
  return {
    title,
    description,
    alternates: {
      canonical: "/blog",
      languages: Object.fromEntries(locales.map((l) => [l, l === "ko" ? "/blog" : `/${l}/blog`])),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/blog",
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

const posts = [
  {
    slug: "best-article-summarizer",
    date: "2026-02-16",
    title: {
      en: "Best Article Summarizer Tools in 2026 — AI-Powered Comparison",
      ko: "2026년 최고의 아티클 요약 도구 — AI 기반 비교 분석",
      ja: "2026年ベスト記事要約ツール — AI搭載比較ガイド",
      es: "Mejores herramientas de resumen de artículos en 2026 — Comparación con IA",
      "pt-BR": "Melhores ferramentas de resumo de artigos em 2026 — Comparação com IA",
      "zh-CN": "2026年最佳文章摘要工具 — AI驱动对比指南",
      de: "Beste Artikelzusammenfassungs-Tools 2026 — KI-gestützter Vergleich",
      fr: "Meilleurs outils de résumé d'articles en 2026 — Comparaison IA",
    },
    excerpt: {
      en: "Compare the best article summarizer tools for 2026. Find out which AI summarizer saves you the most time with side-by-side feature comparisons.",
      ko: "2026년 최고의 아티클 요약 도구를 비교합니다. AI 요약기 기능을 나란히 비교하여 시간을 가장 절약해주는 도구를 찾아보세요.",
      ja: "2026年のベスト記事要約ツールを比較。AI要約ツールの機能を並べて比較し、最も時間を節約できるツールを見つけましょう。",
      es: "Compare las mejores herramientas de resumen de artículos para 2026. Descubra cuál le ahorra más tiempo.",
      "pt-BR":
        "Compare as melhores ferramentas de resumo de artigos para 2026. Descubra qual economiza mais tempo.",
      "zh-CN": "比较2026年最佳文章摘要工具。了解哪款AI摘要工具最能为您节省时间。",
      de: "Vergleichen Sie die besten Artikelzusammenfassungs-Tools für 2026. Finden Sie heraus, welches Ihnen am meisten Zeit spart.",
      fr: "Comparez les meilleurs outils de résumé d'articles pour 2026. Découvrez lequel vous fait gagner le plus de temps.",
    },
  },
  {
    slug: "free-article-summarizer",
    date: "2026-02-16",
    title: {
      en: "Free Article Summarizer Tools — No Sign-Up Required (2026)",
      ko: "무료 아티클 요약 도구 — 회원가입 없이 사용 (2026)",
      ja: "無料記事要約ツール — 登録不要で使える（2026年）",
      es: "Herramientas gratuitas de resumen — Sin registro (2026)",
      "pt-BR": "Ferramentas gratuitas de resumo — Sem cadastro (2026)",
      "zh-CN": "免费文章摘要工具 — 无需注册（2026）",
      de: "Kostenlose Zusammenfassungs-Tools — Ohne Anmeldung (2026)",
      fr: "Outils de résumé gratuits — Sans inscription (2026)",
    },
    excerpt: {
      en: "Looking for a free article summarizer? Compare the best free AI tools that summarize articles instantly — no sign-up, no word limits.",
      ko: "무료 아티클 요약기를 찾고 계신가요? 회원가입 없이 바로 사용할 수 있는 최고의 무료 AI 요약 도구를 비교합니다.",
      ja: "無料の記事要約ツールをお探しですか？登録不要で即座に記事を要約できる最高の無料AIツールを比較します。",
      es: "¿Busca un resumidor gratuito? Compare las mejores herramientas de IA gratuitas que resumen artículos al instante.",
      "pt-BR":
        "Procurando um resumidor gratuito? Compare as melhores ferramentas de IA que resumem artigos instantaneamente.",
      "zh-CN": "正在寻找免费的文章摘要工具？比较最佳免费AI工具，即时生成文章摘要。",
      de: "Suchen Sie einen kostenlosen Zusammenfasser? Vergleichen Sie die besten kostenlosen KI-Tools.",
      fr: "Vous cherchez un outil de résumé gratuit ? Comparez les meilleurs outils IA gratuits.",
    },
  },
  {
    slug: "what-is-semantic-search",
    date: "2026-02-16",
    title: {
      en: "What Is Semantic Search? How AI Understands Meaning (2026 Guide)",
      ko: "시맨틱 검색이란? AI가 의미를 이해하는 방법 (2026 가이드)",
      ja: "セマンティック検索とは？AIが意味を理解する仕組み（2026年ガイド）",
      es: "¿Qué es la búsqueda semántica? Cómo la IA entiende el significado (Guía 2026)",
      "pt-BR": "O que é busca semântica? Como a IA entende o significado (Guia 2026)",
      "zh-CN": "什么是语义搜索？AI如何理解含义（2026指南）",
      de: "Was ist semantische Suche? Wie KI Bedeutung versteht (Leitfaden 2026)",
      fr: "Qu'est-ce que la recherche sémantique ? Comment l'IA comprend le sens (Guide 2026)",
    },
    excerpt: {
      en: "Learn what semantic search is, how it works, and why it's replacing keyword search. Understand vector embeddings, NLP, and real-world applications.",
      ko: "시맨틱 검색이 무엇인지, 어떻게 작동하는지, 왜 키워드 검색을 대체하고 있는지 알아보세요. 벡터 임베딩과 NLP의 원리를 쉽게 설명합니다.",
      ja: "セマンティック検索とは何か、どのように機能するか、なぜキーワード検索に取って代わりつつあるかを学びましょう。",
      es: "Aprenda qué es la búsqueda semántica, cómo funciona y por qué está reemplazando la búsqueda por palabras clave.",
      "pt-BR":
        "Saiba o que é busca semântica, como funciona e por que está substituindo a busca por palavras-chave.",
      "zh-CN": "了解语义搜索是什么、如何工作，以及为什么它正在取代关键词搜索。",
      de: "Erfahren Sie, was semantische Suche ist, wie sie funktioniert und warum sie die Stichwortsuche ersetzt.",
      fr: "Découvrez ce qu'est la recherche sémantique, comment elle fonctionne et pourquoi elle remplace la recherche par mots-clés.",
    },
  },
  {
    slug: "research-article-summarizer",
    date: "2026-02-16",
    title: {
      en: "Research Article Summarizer — AI Tools for Academic Papers (2026)",
      ko: "연구 논문 요약 도구 — 학술 논문을 위한 AI 도구 (2026)",
      ja: "研究論文要約ツール — 学術論文向けAIツール（2026年）",
      es: "Resumidor de artículos de investigación — Herramientas IA para trabajos académicos (2026)",
      "pt-BR": "Resumidor de artigos de pesquisa — Ferramentas IA para trabalhos acadêmicos (2026)",
      "zh-CN": "研究论文摘要工具 — 学术论文AI工具（2026）",
      de: "Forschungsartikel-Zusammenfasser — KI-Tools für wissenschaftliche Arbeiten (2026)",
      fr: "Résumeur d'articles de recherche — Outils IA pour articles académiques (2026)",
    },
    excerpt: {
      en: "Summarize research articles and academic papers with AI. Compare the best research summarizer tools for students, academics, and professionals.",
      ko: "AI로 연구 논문과 학술 아티클을 요약하세요. 학생, 연구자, 전문가를 위한 최고의 연구 논문 요약 도구를 비교합니다.",
      ja: "AIで研究論文や学術記事を要約。学生・研究者・専門家向けのベスト要約ツールを比較します。",
      es: "Resuma artículos de investigación con IA. Compare las mejores herramientas para estudiantes, académicos y profesionales.",
      "pt-BR":
        "Resuma artigos de pesquisa com IA. Compare as melhores ferramentas para estudantes, acadêmicos e profissionais.",
      "zh-CN": "使用AI摘要研究文章和学术论文。比较最适合学生、学者和专业人士的摘要工具。",
      de: "Fassen Sie Forschungsartikel mit KI zusammen. Vergleichen Sie die besten Tools für Studenten, Akademiker und Fachleute.",
      fr: "Résumez des articles de recherche avec l'IA. Comparez les meilleurs outils pour étudiants, chercheurs et professionnels.",
    },
  },
  {
    slug: "chrome-web-clipper",
    date: "2026-02-10",
    title: {
      en: "Chrome Web Clipper: The Complete Guide to Saving and Organizing Web Content (2026)",
      ko: "Chrome Web Clipper: 웹 콘텐츠 저장 및 정리 완벽 가이드 (2026)",
      ja: "Chrome Web Clipper: ウェブコンテンツの保存と整理の完全ガイド（2026年）",
      es: "Chrome Web Clipper: Guía completa para guardar y organizar contenido web (2026)",
      "pt-BR": "Chrome Web Clipper: Guia completo para salvar e organizar conteúdo web (2026)",
      "zh-CN": "Chrome Web Clipper：保存和整理网页内容完全指南（2026）",
      de: "Chrome Web Clipper: Der vollständige Leitfaden zum Speichern und Organisieren von Webinhalten (2026)",
      fr: "Chrome Web Clipper : Guide complet pour sauvegarder et organiser le contenu web (2026)",
    },
    excerpt: {
      en: "Every day, you find amazing articles, research papers, and tutorials — only to lose them in a sea of browser bookmarks. A Chrome web clipper solves this problem completely.",
      ko: "매일 훌륭한 아티클과 연구 자료, 튜토리얼을 발견하지만 북마크 속에서 잃어버리고 있진 않나요? Chrome 웹 클리퍼가 이 문제를 해결합니다.",
      ja: "毎日素晴らしい記事や研究資料を見つけても、ブックマークの中で埋もれていませんか？Chrome ウェブクリッパーがこの問題を解決します。",
      es: "Cada día encuentras artículos increíbles y los pierdes entre marcadores. Un web clipper de Chrome resuelve este problema.",
      "pt-BR":
        "Todo dia você encontra artigos incríveis e os perde entre os favoritos. Um web clipper do Chrome resolve este problema.",
      "zh-CN":
        "每天你都会发现精彩的文章，却在浏览器书签中找不到它们。Chrome网页剪藏工具完美解决这个问题。",
      de: "Jeden Tag finden Sie großartige Artikel und verlieren sie in Lesezeichen. Ein Chrome Web Clipper löst dieses Problem.",
      fr: "Chaque jour, vous trouvez des articles formidables et les perdez dans vos favoris. Un web clipper Chrome résout ce problème.",
    },
  },
  {
    slug: "web-clipper-guide",
    date: "2026-02-10",
    title: {
      en: "Web Clipper Chrome Extension Guide — Best Tools for Saving Articles",
      ko: "웹 클리퍼 크롬 확장 프로그램 추천 — 아티클 저장 완벽 가이드",
      ja: "ウェブクリッパーChrome拡張ガイド — 記事保存に最適なツール",
      es: "Guía de extensiones Web Clipper para Chrome — Mejores herramientas para guardar artículos",
      "pt-BR":
        "Guia de extensões Web Clipper para Chrome — Melhores ferramentas para salvar artigos",
      "zh-CN": "网页剪藏Chrome扩展指南 — 保存文章的最佳工具",
      de: "Web Clipper Chrome-Erweiterung Guide — Beste Tools zum Speichern von Artikeln",
      fr: "Guide des extensions Web Clipper Chrome — Meilleurs outils pour sauvegarder des articles",
    },
    excerpt: {
      en: "Compare the best web clipper extensions for Chrome and learn how to build a knowledge management workflow in 5 minutes.",
      ko: "인기 웹 클리퍼를 비교 분석하고, 5분 만에 나만의 지식 관리 워크플로우를 구축하는 방법을 알아보세요.",
      ja: "人気のウェブクリッパーを比較分析し、5分で自分だけのナレッジ管理ワークフローを構築する方法を紹介します。",
      es: "Compare las mejores extensiones web clipper para Chrome y aprenda a construir un flujo de gestión del conocimiento en 5 minutos.",
      "pt-BR":
        "Compare as melhores extensões web clipper para Chrome e aprenda a construir um fluxo de gestão do conhecimento em 5 minutos.",
      "zh-CN": "比较最佳Chrome网页剪藏扩展，5分钟内建立您的知识管理工作流。",
      de: "Vergleichen Sie die besten Web-Clipper-Erweiterungen für Chrome und lernen Sie in 5 Minuten einen Wissensmanagement-Workflow aufzubauen.",
      fr: "Comparez les meilleures extensions web clipper pour Chrome et apprenez à créer un workflow de gestion des connaissances en 5 minutes.",
    },
  },
];

export default async function BlogIndex({ params }: BlogIndexProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations({ locale: locale as Locale, namespace: "blog" });
  const format = await getFormatter({ locale: locale as Locale });
  const lang = (key: Record<string, string>) => key[locale] || key.en;

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://nod-archive.com" },
          { name: "Blog", url: "https://nod-archive.com/blog" },
        ]}
      />
      <h1 className="mb-4 font-creative-display text-3xl font-bold tracking-tight text-cm-text md:text-4xl">
        {t("title")}
      </h1>
      <p className="mb-12 font-creative-body text-lg text-cm-text-light">{t("subtitle")}</p>

      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group cm-doodle-border bg-cm-bg p-6 transition-all hover:cm-sketch-shadow"
          >
            <Link href={`/${locale}/blog/${post.slug}`} className="block">
              <time className="font-creative-body text-sm text-cm-text/70" dateTime={post.date}>
                {format.dateTime(new Date(post.date), {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="mt-2 font-creative-display text-xl font-semibold text-cm-text group-hover:text-nod-gold transition-colors">
                {lang(post.title)}
              </h2>
              <p className="mt-2 font-creative-body text-sm text-cm-text/80 line-clamp-2">
                {lang(post.excerpt)}
              </p>
              <span className="mt-3 inline-block font-creative-body text-sm font-semibold text-nod-gold">
                {t("readArticle")}
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
