import {
  BadgeHelp,
  BookMarked,
  BookOpen,
  CreditCard,
  ExternalLink,
  Lightbulb,
  Puzzle,
  Search,
  Sparkles,
} from "lucide-react";
import type { CSSProperties } from "react";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";

const HELP_BG_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.2) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0, 11px 11px",
};

interface HelpContentProps {
  locale: string;
}

export function HelpContent({ locale }: HelpContentProps) {
  const isKo = locale === "ko";
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);

  const quickStart = isKo
    ? [
        {
          title: "1) 콘텐츠 저장",
          description: "웹에서 읽고 싶은 글을 익스텐션으로 저장하면 자동으로 아카이브에 쌓여요.",
          icon: BookMarked,
        },
        {
          title: "2) AI 요약 확인",
          description: "저장된 콘텐츠는 자동 요약되고 핵심 개념, 포인트, 메모를 함께 볼 수 있어요.",
          icon: Sparkles,
        },
        {
          title: "3) 인사이트 연결",
          description: "관련 주제를 묶어서 탐색하고 필요한 지식을 빠르게 다시 꺼내 쓰세요.",
          icon: Search,
        },
      ]
    : [
        {
          title: "1) Save content",
          description: "Capture articles with the extension and keep everything in one archive.",
          icon: BookMarked,
        },
        {
          title: "2) Review AI summaries",
          description: "Each saved item gets an AI summary with key points and structured notes.",
          icon: Sparkles,
        },
        {
          title: "3) Connect insights",
          description: "Group related topics and retrieve important knowledge faster.",
          icon: Search,
        },
      ];

  const faq = isKo
    ? [
        {
          q: "요약이 오래 걸리거나 멈춘 것 같아요.",
          a: "콘텐츠 길이나 요청량에 따라 지연될 수 있어요. 잠시 뒤 새로고침하거나 상세 페이지에서 상태를 다시 확인해 주세요.",
        },
        {
          q: "익스텐션이 동작하지 않아요.",
          a: "크롬에 익스텐션이 설치되어 있는지 확인하고, 로그인 상태를 유지한 뒤 페이지를 새로고침해 주세요.",
        },
        {
          q: "플랜은 어디서 관리하나요?",
          a: "결제 관리는 설정 > 결제 관리에서 변경할 수 있고, 요금제는 요금제 페이지에서 확인할 수 있어요.",
        },
      ]
    : [
        {
          q: "A summary is taking too long.",
          a: "Large documents or busy queues can delay processing. Refresh after a short wait and check the article status again.",
        },
        {
          q: "The extension is not working.",
          a: "Make sure the Chrome extension is installed, stay logged in, and refresh the page once.",
        },
        {
          q: "Where can I manage billing?",
          a: "Open Settings > Billing to manage payment details, and view plan options on the pricing page.",
        },
      ];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-65" style={HELP_BG_STYLE} />

      <div className="relative space-y-7">
        <header className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-cm-text/15 bg-white/75 px-3 py-1 font-creative-body text-sm font-bold text-cm-text/65">
            {isKo ? "NOD Help Center" : "NOD Help Center"}
          </p>
          <h1 className="font-creative-display text-[clamp(2rem,3.2vw,3.3rem)] font-black text-cm-text">
            {isKo ? "빠르게 시작하는 NOD 사용 가이드" : "Get Started with NOD"}
          </h1>
          <p className="max-w-4xl font-creative-body text-base italic text-cm-text/65">
            {isKo
              ? "콘텐츠 저장부터 AI 요약 확인, 플랜 관리까지 꼭 필요한 흐름만 간단하게 정리했어요."
              : "From saving content to AI summaries and plan management, here are the essential workflows."}
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {quickStart.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="cm-doodle-border bg-white/95 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cm-text/15 bg-cm-bg/80">
                    <Icon className="h-4 w-4 text-nod-gold" />
                  </div>
                  <h2 className="font-creative-display text-xl font-black text-cm-text">
                    {item.title}
                  </h2>
                </div>
                <p className="font-creative-body text-sm leading-relaxed text-cm-text/70">
                  {item.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="cm-doodle-border bg-white/95 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#8BA888]" />
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {isKo ? "자주 쓰는 바로가기" : "Useful Shortcuts"}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/articles"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 p-4 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white"
            >
              {isKo ? "콘텐츠 페이지" : "Articles"}
            </Link>
            <Link
              href="/settings/billing"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 p-4 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white"
            >
              {isKo ? "결제 관리" : "Billing"}
            </Link>
            <Link
              href="/pricing"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 p-4 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white"
            >
              {isKo ? "요금제 확인" : "Pricing"}
            </Link>
            <a
              href={extensionInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 p-4 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white"
            >
              {isKo ? "익스텐션 설치" : "Install Extension"}
            </a>
          </div>
        </section>

        <section className="cm-doodle-border bg-white/95 p-6">
          <div className="mb-4 flex items-center gap-2">
            <BadgeHelp className="h-5 w-5 text-cm-coral" />
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {isKo ? "자주 묻는 질문" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-3">
            {faq.map((item) => (
              <article
                key={item.q}
                className="cm-doodle-border border-cm-text/15 bg-cm-bg/65 px-4 py-3"
              >
                <h3 className="font-creative-body text-sm font-black text-cm-text">{item.q}</h3>
                <p className="mt-2 font-creative-body text-sm leading-relaxed text-cm-text/70">
                  {item.a}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="cm-doodle-border bg-white/95 p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cm-text/60" />
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {isKo ? "문의 및 피드백" : "Support & Feedback"}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="https://nodarchive.featurebase.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 px-4 py-3 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white"
            >
              <span className="inline-flex items-center gap-1">
                <Puzzle className="h-4 w-4 text-nod-gold" />
                {isKo ? "피드백 보내기" : "Send Feedback"}
                <ExternalLink className="h-3.5 w-3.5 text-cm-text/45" />
              </span>
            </a>

            <Link
              href="/settings/billing"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 px-4 py-3 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white"
            >
              <span className="inline-flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-[#8BA888]" />
                {isKo ? "결제 문제 해결" : "Billing Help"}
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
