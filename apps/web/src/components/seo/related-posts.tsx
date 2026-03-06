import Link from "next/link";

interface RelatedPost {
  slug: string;
  titles: Record<string, string>;
  descriptions: Record<string, string>;
  date: string;
}

const allPosts: RelatedPost[] = [
  {
    slug: "chrome-web-clipper",
    titles: {
      en: "Chrome Web Clipper: Complete Guide",
      ko: "Chrome 웹 클리퍼: 완벽 가이드",
      ja: "Chrome ウェブクリッパー完全ガイド",
    },
    descriptions: {
      en: "Learn how a Chrome web clipper can transform the way you save and organize web content.",
      ko: "Chrome 웹 클리퍼로 웹 콘텐츠를 저장하고 정리하는 방법을 알아보세요.",
      ja: "Chrome ウェブクリッパーでウェブコンテンツを保存・整理する方法を学びましょう。",
    },
    date: "2026-02-10",
  },
  {
    slug: "web-clipper-guide",
    titles: {
      en: "Web Clipper Guide: Save & Organize",
      ko: "웹 클리퍼 가이드: 저장 및 정리",
      ja: "ウェブクリッパーガイド：保存と整理",
    },
    descriptions: {
      en: "A comprehensive guide to using web clippers for research and productivity.",
      ko: "연구와 생산성을 위한 웹 클리퍼 사용 종합 가이드.",
      ja: "研究と生産性のためのウェブクリッパー活用ガイド。",
    },
    date: "2026-02-10",
  },
  {
    slug: "what-is-semantic-search",
    titles: {
      en: "What Is Semantic Search?",
      ko: "시맨틱 검색이란?",
      ja: "セマンティック検索とは？",
    },
    descriptions: {
      en: "Understand how semantic search finds meaning, not just keywords, in your saved content.",
      ko: "시맨틱 검색이 키워드가 아닌 의미를 찾는 방법을 이해해보세요.",
      ja: "セマンティック検索がキーワードではなく意味を見つける仕組みを理解しましょう。",
    },
    date: "2026-02-16",
  },
  {
    slug: "best-article-summarizer",
    titles: {
      en: "Best Article Summarizer Tools",
      ko: "최고의 아티클 요약 도구",
      ja: "最高の記事要約ツール",
    },
    descriptions: {
      en: "Compare the best article summarizer tools and find the right one for your workflow.",
      ko: "최고의 아티클 요약 도구를 비교하고 워크플로우에 맞는 도구를 찾아보세요.",
      ja: "最高の記事要約ツールを比較して、あなたに合ったツールを見つけましょう。",
    },
    date: "2026-02-16",
  },
  {
    slug: "free-article-summarizer",
    titles: {
      en: "Free Article Summarizer",
      ko: "무료 아티클 요약 도구",
      ja: "無料記事要約ツール",
    },
    descriptions: {
      en: "Discover free article summarizer tools that help you save time reading.",
      ko: "읽기 시간을 절약해주는 무료 아티클 요약 도구를 알아보세요.",
      ja: "読書時間を節約する無料記事要約ツールを発見しましょう。",
    },
    date: "2026-02-16",
  },
  {
    slug: "research-article-summarizer",
    titles: {
      en: "Research Article Summarizer",
      ko: "연구 논문 요약 도구",
      ja: "研究論文要約ツール",
    },
    descriptions: {
      en: "Summarize research papers and academic articles with AI-powered tools.",
      ko: "AI 기반 도구로 연구 논문과 학술 자료를 요약해보세요.",
      ja: "AIツールで研究論文や学術記事を要約しましょう。",
    },
    date: "2026-02-16",
  },
];

interface RelatedPostsProps {
  currentSlug: string;
  locale: string;
}

const sectionLabels: Record<string, string> = {
  en: "Related Articles",
  ko: "관련 글",
  ja: "関連記事",
  es: "Articulos relacionados",
  "pt-BR": "Artigos relacionados",
  "zh-CN": "相关文章",
  de: "Verwandte Artikel",
  fr: "Articles associes",
};

export function RelatedPosts({ currentSlug, locale }: RelatedPostsProps) {
  const related = allPosts.filter((p) => p.slug !== currentSlug).slice(0, 3);
  const sectionLabel = sectionLabels[locale] || sectionLabels.en;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-bold text-cm-text">{sectionLabel}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/${locale}/blog/${post.slug}`}
            className="group rounded-xl border border-cm-text/10 bg-cm-mint/10 p-5 transition-colors hover:border-nod-gold/30 hover:bg-nod-gold/5"
          >
            <time className="text-xs text-cm-text/40" dateTime={post.date}>
              {post.date}
            </time>
            <h3 className="mt-2 text-sm font-semibold text-cm-text group-hover:text-nod-gold transition-colors">
              {post.titles[locale] || post.titles.en}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-cm-text/60 line-clamp-2">
              {post.descriptions[locale] || post.descriptions.en}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
