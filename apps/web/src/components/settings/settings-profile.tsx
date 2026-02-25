"use client";

import {
  BarChart3,
  Bolt,
  CreditCard,
  Gavel,
  LogOut,
  Mail,
  MessageSquare,
  Puzzle,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSubscription, useUsage } from "@/lib/api/subscriptions";
import { signOut } from "@/lib/auth/auth-client";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link, useRouter } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/client";

const SETTINGS_BG_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.22) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0, 11px 11px",
};

export function SettingsProfile() {
  const locale = useLocale();
  const router = useRouter();
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

  const planName = subscription?.plan === "pro" ? ts("pro") : ts("basic");
  const providerLabel = provider
    ? provider.charAt(0).toUpperCase() + provider.slice(1)
    : t("fields.emailProviderName");

  const usageLabel = isUnlimited ? ts("unlimited") : `${summariesUsed} / ${summariesLimit}`;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-70" style={SETTINGS_BG_STYLE} />

      <div className="relative space-y-8">
        <header>
          <h1 className="font-creative-display text-[clamp(2rem,3.2vw,3.4rem)] font-black text-cm-text">
            {t("title")}
          </h1>
          <div className="mt-3 h-1.5 w-32 -rotate-1 rounded-full bg-nod-gold/45" />
          <p className="mt-4 font-creative-body text-base italic text-cm-text/65">
            {t("description")}
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <section className="cm-doodle-border cm-sketch-shadow -rotate-[0.5deg] bg-white/95 p-7 dark:bg-cm-surface/95">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div>
                  <Avatar className="h-28 w-28 border-4 border-cm-text bg-white dark:bg-cm-surface">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={userName} referrerPolicy="no-referrer" />
                    ) : null}
                    <AvatarFallback className="text-2xl">{initials || "U"}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="text-center sm:text-left">
                  <h2 className="font-creative-display text-3xl font-black text-cm-text">
                    {userName || "-"}
                  </h2>
                  <p className="mt-1 font-creative-body text-cm-text/55">{userEmail || "-"}</p>
                </div>
              </div>
            </section>

            <section className="cm-doodle-border cm-sketch-shadow rotate-[0.5deg] bg-white/95 p-7 dark:bg-cm-surface/95">
              <div className="mb-5 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-nod-gold" />
                <h3 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("sections.account")}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-dashed border-cm-text/10 pb-3">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/40">
                      {t("fields.email")}
                    </p>
                    <p className="mt-1 font-creative-body font-bold text-cm-text">
                      {userEmail || "-"}
                    </p>
                  </div>
                  <Mail className="h-4 w-4 text-cm-text/30" />
                </div>

                <div className="flex items-center justify-between border-b border-dashed border-cm-text/10 pb-3">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/40">
                      {t("fields.authProvider")}
                    </p>
                    <p className="mt-1 font-creative-body font-bold text-cm-text">
                      {providerLabel}
                    </p>
                  </div>
                  <Shield className="h-4 w-4 text-cm-text/30" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/40">
                      {t("fields.subscription")}
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-creative-body font-bold text-nod-gold">
                      {planName}
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-cm-text/45">
                        ({subscription?.status ? subscription.status : t("status.active")})
                      </span>
                    </p>
                  </div>

                  <Link
                    href="/pricing"
                    className="text-xs font-creative-body font-black text-nod-gold underline decoration-dotted"
                  >
                    {t("actions.changePlan")}
                  </Link>
                </div>
              </div>
            </section>

            <section className="cm-doodle-border cm-sketch-shadow -rotate-[0.4deg] bg-white/95 p-7 dark:bg-cm-surface/95">
              <div className="mb-5 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#8BA888]" />
                <h3 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("usage.title")}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <p className="font-creative-body text-sm font-bold text-cm-text/60">
                    {t("usage.currentMonthlyUsage")}
                  </p>
                  <p className="font-creative-display text-3xl font-black text-cm-text">
                    {usageLabel}
                  </p>
                </div>

                {!isUnlimited ? (
                  <div className="h-5 overflow-hidden rounded-2xl border border-cm-text/15 bg-cm-bg">
                    <div
                      className="h-full bg-nod-gold transition-all duration-500"
                      style={{ width: `${Math.max(6, percentage)}%` }}
                    />
                  </div>
                ) : null}

                <p className="font-creative-body text-xs font-bold italic text-cm-text/45">
                  {t("usage.resetHint")}
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Bolt className="h-5 w-5 text-cm-coral" />
                <h3 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("sections.quickLinks")}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/settings/billing"
                  className="cm-doodle-border bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:cm-sketch-shadow dark:bg-cm-surface"
                >
                  <CreditCard className="mx-auto h-8 w-8 text-nod-gold" />
                  <span className="mt-3 block font-creative-body text-sm font-bold text-cm-text">
                    {t("links.manageBilling")}
                  </span>
                </Link>

                <Link
                  href="/pricing"
                  className="cm-doodle-border bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:cm-sketch-shadow dark:bg-cm-surface"
                >
                  <UserIcon className="mx-auto h-8 w-8 text-[#8BA888]" />
                  <span className="mt-3 block font-creative-body text-sm font-bold text-cm-text">
                    {t("links.viewPricing")}
                  </span>
                </Link>

                <a
                  href={extensionInstallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cm-doodle-border bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:cm-sketch-shadow dark:bg-cm-surface"
                >
                  <Puzzle className="mx-auto h-8 w-8 text-cm-coral" />
                  <span className="mt-3 block font-creative-body text-sm font-bold text-cm-text">
                    {t("links.installExtension")}
                  </span>
                </a>

                <a
                  href="https://nodarchive.featurebase.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cm-doodle-border bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:cm-sketch-shadow dark:bg-cm-surface"
                >
                  <MessageSquare className="mx-auto h-8 w-8 text-cm-text/45" />
                  <span className="mt-3 block font-creative-body text-sm font-bold text-cm-text">
                    {t("links.feedback")}
                  </span>
                </a>
              </div>
            </section>

            <section className="cm-doodle-border border-dashed border-cm-text/20 bg-white/75 p-6 dark:bg-cm-surface/75">
              <div className="mb-5 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-cm-text/50" />
                <h3 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("sections.legal")}
                </h3>
              </div>

              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="group flex items-center gap-3">
                    <span className="h-2 w-2 cm-organic-shape bg-nod-gold transition-transform group-hover:scale-125" />
                    <span className="font-creative-body font-bold text-cm-text transition-colors group-hover:text-nod-gold">
                      {t("links.terms")}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="group flex items-center gap-3">
                    <span className="h-2 w-2 cm-organic-shape bg-[#8BA888] transition-transform group-hover:scale-125" />
                    <span className="font-creative-body font-bold text-cm-text transition-colors group-hover:text-[#8BA888]">
                      {t("links.privacy")}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="group flex items-center gap-3">
                    <span className="h-2 w-2 cm-organic-shape bg-cm-coral transition-transform group-hover:scale-125" />
                    <span className="font-creative-body font-bold text-cm-text transition-colors group-hover:text-cm-coral">
                      {t("links.refund")}
                    </span>
                  </Link>
                </li>
              </ul>
            </section>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className="flex w-full items-center justify-center gap-2 cm-doodle-border border-red-200 bg-white px-6 py-4 font-creative-body text-sm font-black text-red-400 transition-colors hover:bg-red-50 dark:bg-cm-surface dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              {t("actions.signOut")}
            </button>
          </div>
        </div>

        <footer className="pt-4 text-center">
          <p className="font-creative-body text-[11px] font-black uppercase tracking-[0.18em] text-cm-text/30">
            {t("footerTagline")}
          </p>
        </footer>
      </div>
    </div>
  );
}
