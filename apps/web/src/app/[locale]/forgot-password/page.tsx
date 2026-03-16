"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { NodWordmark } from "@/components/brand/nod-wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { resetPassword } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/routing";

function ForgotPasswordContent() {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (email: string) => {
    setIsSubmitting(true);
    await resetPassword(email);
    setIsSubmitting(false);
    setSent(true);
  };

  return (
    <AuthShell>
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

      <main className="flex flex-1 items-center justify-center">
        <div className="cm-doodle-border cm-sketch-shadow w-full max-w-md border-cm-text/18 bg-white/95 p-8 animate-fade-up dark:border-white/15 dark:bg-[#18181d]/95">
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
              {t("auth.forgotPassword.title")}
            </h2>
            <p className="mt-1.5 font-creative-body text-sm text-cm-text/55 dark:text-white/55">
              {t("auth.forgotPassword.subtitle")}
            </p>
          </div>

          <ForgotPasswordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} sent={sent} />
        </div>
      </main>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="flex flex-1 items-center justify-center">
            <div className="cm-doodle-border bg-white/90 px-6 py-3 font-creative-body text-sm font-bold text-cm-text/70 dark:bg-[#17171b] dark:text-white/70">
              Loading...
            </div>
          </div>
        </AuthShell>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
