"use client";

import { CreditCard, Mail, Shield, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSubscription } from "@/lib/api/subscriptions";
import { createClient } from "@/lib/supabase/client";

export function SettingsProfile() {
  const t = useTranslations("settings");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [provider, setProvider] = useState("");
  const { data: subscription } = useSubscription();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

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

      {/* Quick Links */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("sections.quickLinks")}</h2>
        <div className="space-y-2">
          <Link
            href="/settings/billing"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            {t("links.manageBilling")}
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            {t("links.viewPricing")}
          </Link>
        </div>
      </div>
    </div>
  );
}
