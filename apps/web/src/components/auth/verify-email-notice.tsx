"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/routing";

interface VerifyEmailNoticeProps {
  email: string;
  onResend: () => Promise<void>;
}

export function VerifyEmailNotice({ email, onResend }: VerifyEmailNoticeProps) {
  const t = useTranslations();
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    await onResend();
    setResending(false);
    setResent(true);
  };

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-2xl font-bold">{t("auth.verifyEmail.title")}</h1>
      <p className="text-muted-foreground">{t("auth.verifyEmail.description", { email })}</p>

      {!!resent && <p className="text-sm text-green-600">{t("auth.verifyEmail.resent")}</p>}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={resending}
      >
        {t("auth.verifyEmail.resend")}
      </Button>

      <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground">
        {t("auth.verifyEmail.backToLogin")}
      </Link>
    </div>
  );
}
