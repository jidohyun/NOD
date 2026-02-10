import Link from "next/link";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

interface BlogIndexProps {
  params: Promise<{ locale: string }>;
}

const posts = [
  {
    slug: "chrome-web-clipper",
    date: "2026-02-10",
    dateLabel: { en: "February 10, 2026", ko: "2026년 2월 10일" },
    title: {
      en: "Chrome Web Clipper: The Complete Guide to Saving and Organizing Web Content (2026)",
      ko: "Chrome Web Clipper: 웹 콘텐츠 저장 및 정리 완벽 가이드 (2026)",
    },
    excerpt: {
      en: "Every day, you find amazing articles, research papers, and tutorials — only to lose them in a sea of browser bookmarks. A Chrome web clipper solves this problem completely.",
      ko: "매일 훌륭한 아티클과 연구 자료, 튜토리얼을 발견하지만 북마크 속에서 잃어버리고 있진 않나요? Chrome 웹 클리퍼가 이 문제를 해결합니다.",
    },
  },
  {
    slug: "web-clipper-guide",
    date: "2026-02-10",
    dateLabel: { en: "February 10, 2026", ko: "2026년 2월 10일" },
    title: {
      en: "Web Clipper Chrome Extension Guide — Best Tools for Saving Articles",
      ko: "웹 클리퍼 크롬 확장 프로그램 추천 — 아티클 저장 완벽 가이드",
    },
    excerpt: {
      en: "Compare the best web clipper extensions for Chrome and learn how to build a knowledge management workflow in 5 minutes.",
      ko: "인기 웹 클리퍼를 비교 분석하고, 5분 만에 나만의 지식 관리 워크플로우를 구축하는 방법을 알아보세요.",
    },
  },
];

export default async function BlogIndex({ params }: BlogIndexProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const lang = locale === "ko" ? "ko" : "en";

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
        {lang === "ko" ? "블로그" : "Blog"}
      </h1>
      <p className="mb-12 text-lg text-neutral-400">
        {lang === "ko"
          ? "지식 관리와 생산성에 관한 팁, 가이드, 인사이트를 공유합니다."
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
                {lang === "ko" ? "읽어보기 →" : "Read article →"}
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
