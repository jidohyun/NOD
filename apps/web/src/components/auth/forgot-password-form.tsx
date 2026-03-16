"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/routing";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => void;
  isSubmitting: boolean;
  sent: boolean;
}

export function ForgotPasswordForm({ onSubmit, isSubmitting, sent }: ForgotPasswordFormProps) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = z.string().email().safeParse(email);
    if (!result.success) {
      setValidationError(t("auth.forgotPassword.emailInvalid"));
      return;
    }

    onSubmit(email);
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-muted-foreground">{t("auth.forgotPassword.sent")}</p>
        <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground">
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Input
          type="email"
          placeholder={t("auth.forgotPassword.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {!!validationError && <p className="mt-1 text-sm text-destructive">{validationError}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("auth.forgotPassword.send")}
      </Button>

      <Link
        href="/login"
        className="block text-center text-sm text-muted-foreground hover:text-foreground"
      >
        {t("auth.forgotPassword.backToLogin")}
      </Link>
    </form>
  );
}
