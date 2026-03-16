"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/routing";

type ValidationErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;

interface SignupFormProps {
  onSubmit: (name: string, email: string, password: string) => void;
  onGoogleSignUp: () => void;
  isSubmitting: boolean;
  error: string | null;
  onErrorClear?: () => void;
}

export function SignupForm({
  onSubmit,
  onGoogleSignUp,
  isSubmitting,
  error,
  onErrorClear,
}: SignupFormProps) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const clearField = (field: keyof ValidationErrors) => {
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const errors: ValidationErrors = {};

    if (!name.trim()) {
      errors.name = t("signup.nameRequired");
    }

    const emailResult = z.string().email().safeParse(email);
    if (!emailResult.success) {
      errors.email = t("signup.emailInvalid");
    }

    if (password.length < 8) {
      errors.password = t("signup.passwordMin");
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = t("signup.passwordMismatch");
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSubmit(name, email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Input
          type="text"
          placeholder={t("signup.namePlaceholder")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearField("name");
          }}
          autoComplete="name"
        />
        {!!validationErrors.name && (
          <p className="mt-1 text-sm text-destructive">{validationErrors.name}</p>
        )}
      </div>

      <div>
        <Input
          type="email"
          placeholder={t("signup.emailPlaceholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearField("email");
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
          placeholder={t("signup.passwordPlaceholder")}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearField("password");
          }}
          autoComplete="new-password"
        />
        {!!validationErrors.password && (
          <p className="mt-1 text-sm text-destructive">{validationErrors.password}</p>
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder={t("signup.confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearField("confirmPassword");
          }}
          autoComplete="new-password"
        />
        {!!validationErrors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive">{validationErrors.confirmPassword}</p>
        )}
      </div>

      {!!error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("signup.creating") : t("signup.createAccount")}
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">{t("signup.orDivider")}</span>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={onGoogleSignUp}>
        {t("signup.continueWithGoogle")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("signup.hasAccount")}{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          {t("signup.signInLink")}
        </Link>
      </p>
    </form>
  );
}
