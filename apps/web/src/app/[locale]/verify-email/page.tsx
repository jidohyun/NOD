"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailNotice } from "@/components/auth/verify-email-notice";
import { NodWordmark } from "@/components/brand/nod-wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { resendVerificationEmail } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/routing";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const handleResend = async () => {
    await resendVerificationEmail(email);
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
          </div>

          <VerifyEmailNotice email={email} onResend={handleResend} />
        </div>
      </main>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
