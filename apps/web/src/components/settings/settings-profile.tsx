"use client";

import { CreditCard, FileText, Mail, Puzzle, Shield, User as UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSubscription, useUsage } from "@/lib/api/subscriptions";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/client";

export function SettingsProfile() {
  const locale = useLocale();
  const t = useTranslations("settings");
  const ts = useTranslations("subscription");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [provider, setProvider] = useState("");
  const { data: subscription } = useSubscription();
  const { data: usage } = useUsage();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.user_metadata;
        setUserName(meta?.full_name ?? meta?.name ?? user.email?.split("@")[0] ?? "");
        setUserEmail(user.email ?? "");
        setAvatarUrl(meta?.avatar_url ?? meta?.picture ?? "");
        setProvider(user.app_metadata?.provider ?? "email");
      }
    });
  }, []);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);

  const summariesUsed = usage?.summaries_used ?? 0;
  const summariesLimit = usage?.summaries_limit ?? 0;
  const isUnlimited = summariesLimit === -1;
  const percentage = isUnlimited
    ? 0
    : summariesLimit > 0
      ? Math.min((summariesUsed / summariesLimit) * 100, 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("sections.profile")}</h2>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={userName} referrerPolicy="no-referrer" />
                ) : null}
                <AvatarFallback className="text-lg">{initials || "U"}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("sections.account")}</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("fields.email")}</p>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("fields.authProvider")}</p>
                  <p className="text-sm capitalize text-muted-foreground">{provider}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("fields.subscription")}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {subscription?.plan ?? "basic"} — {subscription?.status ?? "active"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Overview */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{ts("usage")}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ts("usage")}</span>
                <span className="font-medium">
                  {isUnlimited ? ts("unlimited") : `${summariesUsed}/${summariesLimit}`}
                </span>
              </div>
              {!isUnlimited ? (
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      percentage >= 100
                        ? "bg-destructive"
                        : percentage >= 80
                          ? "bg-yellow-500"
                          : "bg-primary"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("sections.quickLinks")}</h2>
            <div className="space-y-2">
              <Link
                href="/settings/billing"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {t("links.manageBilling")}
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                {t("links.viewPricing")}
              </Link>
              <a
                href={extensionInstallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <Puzzle className="h-4 w-4 text-muted-foreground" />
                {t("links.installExtension")}
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("sections.legal")}</h2>
            <div className="space-y-2">
              <Link
                href="/terms"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t("links.terms")}
              </Link>
              <Link
                href="/privacy"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <Shield className="h-4 w-4 text-muted-foreground" />
                {t("links.privacy")}
              </Link>
              <Link
                href="/refund"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {t("links.refund")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
