"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/routing";

interface EmailLoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isSubmitting: boolean;
  error: string | null;
  onErrorClear?: () => void;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function EmailLoginForm({
  onSubmit,
  isSubmitting,
  error,
  onErrorClear,
}: EmailLoginFormProps) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "email") {
          fieldErrors.email = t("signup.emailInvalid");
        }
        if (issue.path[0] === "password") {
          fieldErrors.password = t("auth.resetPassword.passwordMin");
        }
      }
      setValidationErrors(fieldErrors);
      return;
    }

    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Input
          type="email"
          placeholder={t("login.emailPlaceholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setValidationErrors((prev) => ({ ...prev, email: undefined }));
            onErrorClear?.();
          }}
          autoComplete="email"
        />
        {!!validationErrors.email && (
          <p className="mt-1 text-sm text-destructive">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder={t("login.passwordPlaceholder")}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setValidationErrors((prev) => ({ ...prev, password: undefined }));
            onErrorClear?.();
          }}
          autoComplete="current-password"
        />
        {!!validationErrors.password && (
          <p className="mt-1 text-sm text-destructive">{validationErrors.password}</p>
        )}
      </div>

      {!!error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("login.signInWithEmail")}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
          {t("login.forgotPassword")}
        </Link>
        <span className="text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            {t("login.signUpLink")}
          </Link>
        </span>
      </div>
    </form>
  );
}
