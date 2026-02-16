import Link from "next/link";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

interface BlogIndexProps {
  params: Promise<{ locale: string }>;
}

const posts = [
  {
    slug: "best-article-summarizer",
    date: "2026-02-16",
    dateLabel: { en: "February 16, 2026", ko: "2026년 2월 16일", ja: "2026年2月16日" },
    title: {
      en: "Best Article Summarizer Tools in 2026 — AI-Powered Comparison",
      ko: "2026년 최고의 아티클 요약 도구 — AI 기반 비교 분석",
      ja: "2026年ベスト記事要約ツール — AI搭載比較ガイド",
    },
    excerpt: {
      en: "Compare the best article summarizer tools for 2026. Find out which AI summarizer saves you the most time with side-by-side feature comparisons.",
      ko: "2026년 최고의 아티클 요약 도구를 비교합니다. AI 요약기 기능을 나란히 비교하여 시간을 가장 절약해주는 도구를 찾아보세요.",
      ja: "2026年のベスト記事要約ツールを比較。AI要約ツールの機能を並べて比較し、最も時間を節約できるツールを見つけましょう。",
    },
  },
  {
    slug: "free-article-summarizer",
    date: "2026-02-16",
    dateLabel: { en: "February 16, 2026", ko: "2026년 2월 16일", ja: "2026年2月16日" },
    title: {
      en: "Free Article Summarizer Tools — No Sign-Up Required (2026)",
      ko: "무료 아티클 요약 도구 — 회원가입 없이 사용 (2026)",
      ja: "無料記事要約ツール — 登録不要で使える（2026年）",
    },
    excerpt: {
      en: "Looking for a free article summarizer? Compare the best free AI tools that summarize articles instantly — no sign-up, no word limits.",
      ko: "무료 아티클 요약기를 찾고 계신가요? 회원가입 없이 바로 사용할 수 있는 최고의 무료 AI 요약 도구를 비교합니다.",
      ja: "無料の記事要約ツールをお探しですか？登録不要で即座に記事を要約できる最高の無料AIツールを比較します。",
    },
  },
  {
    slug: "what-is-semantic-search",
    date: "2026-02-16",
    dateLabel: { en: "February 16, 2026", ko: "2026년 2월 16일", ja: "2026年2月16日" },
    title: {
      en: "What Is Semantic Search? How AI Understands Meaning (2026 Guide)",
      ko: "시맨틱 검색이란? AI가 의미를 이해하는 방법 (2026 가이드)",
      ja: "セマンティック検索とは？AIが意味を理解する仕組み（2026年ガイド）",
    },
    excerpt: {
      en: "Learn what semantic search is, how it works, and why it's replacing keyword search. Understand vector embeddings, NLP, and real-world applications.",
      ko: "시맨틱 검색이 무엇인지, 어떻게 작동하는지, 왜 키워드 검색을 대체하고 있는지 알아보세요. 벡터 임베딩과 NLP의 원리를 쉽게 설명합니다.",
      ja: "セマンティック検索とは何か、どのように機能するか、なぜキーワード検索に取って代わりつつあるかを学びましょう。",
    },
  },
  {
    slug: "research-article-summarizer",
    date: "2026-02-16",
    dateLabel: { en: "February 16, 2026", ko: "2026년 2월 16일", ja: "2026年2月16日" },
    title: {
      en: "Research Article Summarizer — AI Tools for Academic Papers (2026)",
      ko: "연구 논문 요약 도구 — 학술 논문을 위한 AI 도구 (2026)",
      ja: "研究論文要約ツール — 学術論文向けAIツール（2026年）",
    },
    excerpt: {
      en: "Summarize research articles and academic papers with AI. Compare the best research summarizer tools for students, academics, and professionals.",
      ko: "AI로 연구 논문과 학술 아티클을 요약하세요. 학생, 연구자, 전문가를 위한 최고의 연구 논문 요약 도구를 비교합니다.",
      ja: "AIで研究論文や学術記事を要約。学生・研究者・専門家向けのベスト要約ツールを比較します。",
    },
  },
  {
    slug: "chrome-web-clipper",
    date: "2026-02-10",
    dateLabel: { en: "February 10, 2026", ko: "2026년 2월 10일", ja: "2026年2月10日" },
    title: {
      en: "Chrome Web Clipper: The Complete Guide to Saving and Organizing Web Content (2026)",
      ko: "Chrome Web Clipper: 웹 콘텐츠 저장 및 정리 완벽 가이드 (2026)",
      ja: "Chrome Web Clipper: ウェブコンテンツの保存と整理の完全ガイド（2026年）",
    },
    excerpt: {
      en: "Every day, you find amazing articles, research papers, and tutorials — only to lose them in a sea of browser bookmarks. A Chrome web clipper solves this problem completely.",
      ko: "매일 훌륭한 아티클과 연구 자료, 튜토리얼을 발견하지만 북마크 속에서 잃어버리고 있진 않나요? Chrome 웹 클리퍼가 이 문제를 해결합니다.",
      ja: "毎日素晴らしい記事や研究資料を見つけても、ブックマークの中で埋もれていませんか？Chrome ウェブクリッパーがこの問題を解決します。",
    },
  },
  {
    slug: "web-clipper-guide",
    date: "2026-02-10",
    dateLabel: { en: "February 10, 2026", ko: "2026년 2월 10일", ja: "2026年2月10日" },
    title: {
      en: "Web Clipper Chrome Extension Guide — Best Tools for Saving Articles",
      ko: "웹 클리퍼 크롬 확장 프로그램 추천 — 아티클 저장 완벽 가이드",
      ja: "ウェブクリッパーChrome拡張ガイド — 記事保存に最適なツール",
    },
    excerpt: {
      en: "Compare the best web clipper extensions for Chrome and learn how to build a knowledge management workflow in 5 minutes.",
      ko: "인기 웹 클리퍼를 비교 분석하고, 5분 만에 나만의 지식 관리 워크플로우를 구축하는 방법을 알아보세요.",
      ja: "人気のウェブクリッパーを比較分析し、5分で自分だけのナレッジ管理ワークフローを構築する方法を紹介します。",
    },
  },
];

export default async function BlogIndex({ params }: BlogIndexProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const lang = locale === "ko" ? "ko" : locale === "ja" ? "ja" : "en";

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
        {lang === "ko" ? "블로그" : lang === "ja" ? "ブログ" : "Blog"}
      </h1>
      <p className="mb-12 text-lg text-neutral-400">
        {lang === "ko"
          ? "지식 관리와 생산성에 관한 팁, 가이드, 인사이트를 공유합니다."
          : lang === "ja"
            ? "ナレッジ管理と生産性に関するヒント、ガイド、インサイトを共有します。"
            : "Tips, guides, and insights on knowledge management and productivity."}
      </p>

      <div className="space-y-8">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
          >
            <Link href={`/${locale}/blog/${post.slug}`} className="block">
              <time className="text-sm text-neutral-500" dateTime={post.date}>
                {post.dateLabel[lang]}
              </time>
              <h2 className="mt-2 text-xl font-semibold text-white group-hover:text-[#E8B931] transition-colors">
                {post.title[lang]}
              </h2>
              <p className="mt-2 text-sm text-neutral-400 line-clamp-2">{post.excerpt[lang]}</p>
              <span className="mt-3 inline-block text-sm font-medium text-[#E8B931]">
                {lang === "ko" ? "읽어보기 →" : lang === "ja" ? "記事を読む →" : "Read article →"}
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
