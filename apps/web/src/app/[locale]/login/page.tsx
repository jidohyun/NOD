"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { getSupabase, signInWithGoogle } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

function LoginContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get redirect URL from query params, default to /dashboard
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
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-white/40 text-sm">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-nod-gold flex items-center justify-center">
            <span className="font-display font-bold text-lg text-[#0A0A0B] tracking-tight">N</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-nod-surface-raised border border-nod-border rounded-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-white mb-2">{t("loginWelcome")}</h1>
            <p className="text-sm text-white/50">{t("loginSubtitle")}</p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn}
            className={cn(
              "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-nod-border bg-white/[0.03]",
              "text-white/90 font-medium text-sm",
              "transition-all duration-200",
              "hover:border-white/[0.12] hover:bg-white/[0.06]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              signingIn && "opacity-50 cursor-wait"
            )}
          >
            <svg
              className="w-5 h-5"
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-nod-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-nod-surface-raised text-white/30">{t("login.or")}</span>
            </div>
          </div>

          {/* Back to Home */}
          <Link
            href="/"
            className={cn(
              "block w-full text-center px-4 py-3 rounded-lg",
              "text-white/50 text-sm font-medium",
              "border border-nod-border",
              "transition-all duration-200",
              "hover:border-white/[0.12] hover:text-white/80"
            )}
          >
            {t("login.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
