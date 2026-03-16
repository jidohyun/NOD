"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/routing";

interface ResetPasswordFormProps {
  onSubmit: (password: string) => void;
  isSubmitting: boolean;
  success: boolean;
}

export function ResetPasswordForm({ onSubmit, isSubmitting, success }: ResetPasswordFormProps) {
  const t = useTranslations();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const errors: Record<string, string> = {};

    if (password.length < 8) {
      errors.password = t("auth.resetPassword.passwordMin");
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = t("auth.resetPassword.passwordMismatch");
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSubmit(password);
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-muted-foreground">{t("auth.resetPassword.success")}</p>
        <Link href="/login" className="block text-sm font-medium text-foreground hover:underline">
          {t("auth.resetPassword.goToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Input
          type="password"
          placeholder={t("auth.resetPassword.newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {!!validationErrors.password && (
          <p className="mt-1 text-sm text-destructive">{validationErrors.password}</p>
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder={t("auth.resetPassword.confirmPassword")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        {!!validationErrors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("auth.resetPassword.submit")}
      </Button>
    </form>
  );
}
