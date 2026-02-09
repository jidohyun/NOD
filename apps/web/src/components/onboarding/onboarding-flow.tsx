"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { env } from "@/config/env";
import type { Article } from "@/lib/api/articles";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import {
  type ExtensionPingResult,
  pingExtension,
  postTokenToExtension,
} from "./lib/extension-bridge";
import { DoneStep } from "./steps/done-step";
import { ExtensionStep } from "./steps/extension-step";
import { LanguageStep } from "./steps/language-step";
import { SaveStep } from "./steps/save-step";
import { SummaryStep } from "./steps/summary-step";

type LocaleId = "ko" | "en" | "ja";

type UserMeResponse = {
  preferred_locale: string | null;
  onboarding_completed_at: string | null;
};

type UpdateUserMeRequest = {
  preferred_locale?: LocaleId;
  onboarding_completed?: boolean;
};

type ArticleListItem = {
  id: string;
  url: string | null;
  title: string;
  status: string;
};

type PaginatedArticles = {
  data: ArticleListItem[];
  meta: { total: number };
};

const SAMPLE_ARTICLE_URL = "https://stripe.com/blog/payment-api-design";

type Step = "language" | "extension" | "save" | "summary" | "done";

function getOnboardingPath(locale: LocaleId, step?: Step): string {
  const base = locale === "ko" ? "/onboarding" : `/${locale}/onboarding`;
  if (!step) return base;
  return `${base}?step=${encodeURIComponent(step)}`;
}

export function OnboardingFlow() {
  const t = useTranslations("onboarding");
  const locale = useLocale() as LocaleId;
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStepFromQuery = useMemo(() => {
    const raw = searchParams.get("step");
    if (raw === "extension" || raw === "save" || raw === "summary" || raw === "done") {
      return raw as Step;
    }
    return "language" as Step;
  }, [searchParams]);

  const [step, setStep] = useState<Step>(initialStepFromQuery);

  const [ext, setExt] = useState<ExtensionPingResult>({ installed: false, authenticated: false });
  const [extCheckState, setExtCheckState] = useState<"idle" | "checking">("idle");
  const [extConnectState, setExtConnectState] = useState<"idle" | "connecting">("idle");

  const [firstArticleId, setFirstArticleId] = useState<string | null>(null);
  const [savePollState, setSavePollState] = useState<"idle" | "polling">("idle");
  const [summaryState, setSummaryState] = useState<"idle" | "waiting" | "success">("idle");

  const savePollTimer = useRef<number | null>(null);
  const summaryPollTimer = useRef<number | null>(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const { data } = await apiClient.get<UserMeResponse>("/api/users/me");
        if (data.onboarding_completed_at) {
          router.replace("/dashboard");
        }
      } catch {
        // If the API isn't deployed yet, avoid blocking the page.
      }
    }

    void loadMe();
  }, [router]);

  useEffect(() => {
    return () => {
      if (savePollTimer.current) window.clearInterval(savePollTimer.current);
      if (summaryPollTimer.current) window.clearInterval(summaryPollTimer.current);
    };
  }, []);

  const patchMe = useCallback(async (payload: UpdateUserMeRequest) => {
    await apiClient.patch<UserMeResponse>("/api/users/me", payload);
  }, []);

  const handleLocaleSelect = useCallback(
    async (next: LocaleId) => {
      await patchMe({ preferred_locale: next });
      window.location.assign(getOnboardingPath(next, "extension"));
    },
    [patchMe]
  );

  const checkExtension = useCallback(async () => {
    setExtCheckState("checking");
    try {
      const result = await pingExtension();
      setExt(result);
    } finally {
      setExtCheckState("idle");
    }
  }, []);

  const connectExtension = useCallback(async () => {
    setExtConnectState("connecting");
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const ok = await postTokenToExtension(token);
      if (!ok) return;
      const result = await pingExtension();
      setExt(result);
    } finally {
      setExtConnectState("idle");
    }
  }, []);

  async function startPollingForFirstArticle() {
    if (savePollState === "polling") return;
    setSavePollState("polling");

    const runOnce = async () => {
      const { data } = await apiClient.get<PaginatedArticles>("/api/articles", {
        params: { page: 1, limit: 5 },
      });
      const first = data.data[0];
      if (first?.id) {
        setFirstArticleId(first.id);
        setStep("summary");
        setSavePollState("idle");
        if (savePollTimer.current) {
          window.clearInterval(savePollTimer.current);
          savePollTimer.current = null;
        }
      }
    };

    await runOnce();
    savePollTimer.current = window.setInterval(() => {
      void runOnce();
    }, 2000);
  }

  const startPollingForSummary = useCallback(
    async (articleId: string) => {
      if (summaryState === "waiting") return;
      setSummaryState("waiting");

      const runOnce = async () => {
        const { data } = await apiClient.get<Article>(`/api/articles/${articleId}`);
        if (data.summary) {
          setSummaryState("success");
          await patchMe({ onboarding_completed: true });
          setStep("done");
          if (summaryPollTimer.current) {
            window.clearInterval(summaryPollTimer.current);
            summaryPollTimer.current = null;
          }
        }
      };

      await runOnce();
      summaryPollTimer.current = window.setInterval(() => {
        void runOnce();
      }, 2000);
    },
    [summaryState, patchMe]
  );

  useEffect(() => {
    if (step === "extension") {
      void checkExtension();
    }
  }, [step, checkExtension]);

  useEffect(() => {
    if (step === "summary" && firstArticleId) {
      void startPollingForSummary(firstArticleId);
    }
  }, [step, firstArticleId, startPollingForSummary]);

  const appName = env.NEXT_PUBLIC_SITE_URL || "NOD";

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl border border-nod-border bg-nod-surface-raised p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-nod-gold flex items-center justify-center">
              <span className="font-display font-bold text-sm text-[#0A0A0B] tracking-tight">
                N
              </span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">{t("title")}</h1>
              <p className="text-sm text-white/50">{t("subtitle", { app: appName })}</p>
            </div>
          </div>
        </div>

        {step === "language" ? (
          <LanguageStep locale={locale} onSelect={(l) => void handleLocaleSelect(l)} />
        ) : null}

        {step === "extension" ? (
          <ExtensionStep
            ext={ext}
            extCheckState={extCheckState}
            extConnectState={extConnectState}
            onRecheck={() => void checkExtension()}
            onConnect={() => void connectExtension()}
            onNext={() => setStep("save")}
          />
        ) : null}

        {step === "save" ? (
          <SaveStep
            sampleUrl={SAMPLE_ARTICLE_URL}
            savePollState={savePollState}
            onConfirmSaved={() => void startPollingForFirstArticle()}
          />
        ) : null}

        {step === "summary" ? <SummaryStep summaryState={summaryState} /> : null}

        {step === "done" ? <DoneStep onDone={() => router.replace("/dashboard")} /> : null}
      </div>
    </div>
  );
}
