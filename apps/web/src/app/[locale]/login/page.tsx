"use client";

import { ArrowLeft, BookmarkCheck, Brain, Search, Shield } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { NodWordmark } from "@/components/brand/nod-wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getSupabase, signInWithGoogle } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-nod-gold selection:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(196,154,28,0.24)_1px,_transparent_0)] bg-[size:24px_24px] opacity-45 dark:opacity-20" />
      <div className="pointer-events-none absolute top-[-120px] right-[-90px] h-[300px] w-[300px] rounded-full bg-cm-mint/55 blur-3xl animate-cm-float dark:bg-nod-gold/10" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[-80px] h-[320px] w-[320px] rounded-full bg-cm-lavender/65 blur-3xl animate-cm-float-reverse dark:bg-white/5" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-8 pb-10 pt-8">
        {children}
      </div>
    </div>
  );
}

function LoginContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace(redirectTo);
      } else {
        setIsLoading(false);
      }
    });
  }, [router, redirectTo]);

  const handleSignIn = async () => {
    setSigningIn(true);
    const { error } = await signInWithGoogle(redirectTo);
    if (error) {
      setSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <LoginShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="cm-doodle-border bg-white/90 px-6 py-3 font-creative-body text-sm font-bold text-cm-text/70 dark:bg-[#17171b] dark:text-white/70">
            {t("common.loading")}
          </div>
        </div>
      </LoginShell>
    );
  }

  const highlights = [
    { icon: BookmarkCheck, textKey: "login.highlightSave" },
    { icon: Brain, textKey: "login.highlightAnalyze" },
    { icon: Search, textKey: "login.highlightSearch" },
  ] as const;

  return (
    <LoginShell>
      <header className="mb-10 flex items-center justify-between animate-fade-up">
        <Link href="/" className="group inline-flex items-center gap-2">
          <div className="cm-organic-shape bg-nod-gold/15 p-2 transition-colors group-hover:bg-nod-gold/25">
            <NodWordmark
              size="sm"
              priority
              className="opacity-90 transition-opacity group-hover:opacity-100"
            />
          </div>
        </Link>

        <ThemeToggle className="cm-doodle-border border-cm-text/20 text-cm-text/70 hover:bg-cm-bg dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10" />
      </header>

      <main className="grid flex-1 items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="cm-doodle-border cm-sketch-shadow border-cm-text/18 bg-white/92 p-9 text-cm-text animate-fade-up [animation-delay:100ms] dark:border-white/15 dark:bg-[#141418]/95 dark:text-white">
          <p className="inline-flex items-center rounded-full border border-cm-text/15 bg-cm-bg/70 px-3 py-1 font-creative-body text-xs font-black tracking-[0.18em] text-cm-text/55 dark:border-white/15 dark:bg-white/5 dark:text-white/65">
            NOD
          </p>
          <h1 className="mt-6 font-creative-display text-4xl font-black tracking-tight">
            {t("loginWelcome")}
          </h1>
          <p className="mt-3 max-w-lg font-creative-body text-base leading-relaxed text-cm-text/70 dark:text-white/70">
            {t("loginSubtitle")}
          </p>

          <div className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, textKey }, i) => (
              <div
                key={textKey}
                className="cm-doodle-border flex items-center gap-3 border-cm-text/12 bg-cm-bg/50 px-4 py-3 transition-all duration-200 hover:bg-cm-bg/80 animate-fade-up dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                style={{ animationDelay: `${(i + 2) * 120}ms` }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-nod-gold/30 bg-[#fff7dd] dark:border-nod-gold/20 dark:bg-nod-gold/10">
                  <Icon className="h-4 w-4 text-nod-gold-muted" />
                </div>
                <span className="ko-keep font-creative-body text-sm font-semibold text-cm-text/75 dark:text-white/75">
                  {t(textKey)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 animate-fade-up [animation-delay:600ms]">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-creative-body text-xs text-cm-text/50 dark:text-white/45">
              {t("login.secureNote")}
            </span>
          </div>
        </section>

        <section className="cm-doodle-border cm-sketch-shadow border-cm-text/18 bg-white/95 p-8 animate-fade-up [animation-delay:200ms] dark:border-white/15 dark:bg-[#18181d]/95">
          <div className="mb-6 text-center">
            <Image
              src="/brand/nod-icon.png"
              alt="NOD"
              width={56}
              height={56}
              className="mx-auto h-14 w-14"
              priority
            />
            <h2 className="mt-4 font-creative-display text-lg font-black text-cm-text dark:text-white">
              {t("login.signInTitle")}
            </h2>
            <p className="mt-1.5 font-creative-body text-sm text-cm-text/55 dark:text-white/55">
              {t("login.signInSubtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn}
            className={cn(
              "cm-doodle-border flex w-full items-center justify-center gap-3 border-cm-text/20 bg-nod-gold px-5 py-3.5 font-creative-body text-sm font-black text-black transition-all",
              "hover:-translate-y-0.5 hover:bg-[#f0c958] hover:scale-[1.01]",
              "disabled:cursor-not-allowed disabled:opacity-55",
              signingIn && "cursor-wait"
            )}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              role="img"
              aria-labelledby="google-logo-title"
            >
              <title id="google-logo-title">Google</title>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>{signingIn ? t("login.signingIn") : t("continueWithGoogle")}</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cm-text/15 dark:border-white/15" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 font-creative-body font-bold text-cm-text/45 dark:bg-[#18181d] dark:text-white/40">
                {t("login.or")}
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="cm-doodle-border inline-flex w-full items-center justify-center gap-2 border-cm-text/18 bg-white px-5 py-3 font-creative-body text-sm font-black text-cm-text transition-all hover:-translate-y-0.5 hover:bg-cm-bg dark:border-white/15 dark:bg-[#202027] dark:text-white/85 dark:hover:bg-[#272730]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("login.backToHome")}
          </Link>
        </section>
      </main>
    </LoginShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoginShell>
          <div className="flex flex-1 items-center justify-center">
            <div className="cm-doodle-border bg-white/90 px-6 py-3 font-creative-body text-sm font-bold text-cm-text/70 dark:bg-[#17171b] dark:text-white/70">
              Loading...
            </div>
          </div>
        </LoginShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
