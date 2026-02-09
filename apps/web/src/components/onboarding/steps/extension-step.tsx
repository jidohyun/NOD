"use client";

import { useTranslations } from "next-intl";
import { CHROME_EXTENSION_INSTALL_URL } from "@/lib/chrome-extension";
import type { ExtensionPingResult } from "../lib/extension-bridge";

export function ExtensionStep({
  ext,
  extCheckState,
  extConnectState,
  onRecheck,
  onConnect,
  onNext,
}: {
  ext: ExtensionPingResult;
  extCheckState: "idle" | "checking";
  extConnectState: "idle" | "connecting";
  onRecheck: () => void;
  onConnect: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("onboarding");

  return (
    <section className="space-y-4">
      <h2 className="text-white font-semibold">{t("extension.title")}</h2>
      <p className="text-sm text-white/50">{t("extension.description")}</p>

      <div className="rounded-lg border border-nod-border bg-white/[0.02] p-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-white/80">{t("extension.statusInstalled")}</span>
          <span className="text-sm text-white/60">
            {extCheckState === "checking"
              ? t("extension.checking")
              : ext.installed
                ? t("extension.yes")
                : t("extension.no")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-white/80">{t("extension.statusConnected")}</span>
          <span className="text-sm text-white/60">
            {ext.installed ? (ext.authenticated ? t("extension.yes") : t("extension.no")) : "—"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={CHROME_EXTENSION_INSTALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-nod-gold px-4 py-2.5 text-sm font-semibold text-[#0A0A0B] hover:bg-nod-gold/90"
        >
          {t("extension.installCta")}
        </a>
        <button
          type="button"
          onClick={onRecheck}
          disabled={extCheckState === "checking"}
          className="inline-flex items-center justify-center rounded-lg border border-nod-border bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.06] disabled:opacity-50"
        >
          {t("extension.recheck")}
        </button>

        {ext.installed && !ext.authenticated ? (
          <button
            type="button"
            onClick={onConnect}
            disabled={extConnectState === "connecting"}
            className="inline-flex items-center justify-center rounded-lg border border-nod-border bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.06] disabled:opacity-50"
          >
            {extConnectState === "connecting" ? t("extension.connecting") : t("extension.connect")}
          </button>
        ) : null}

        {ext.installed ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center justify-center rounded-lg border border-nod-border bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.06]"
          >
            {t("common.next")}
          </button>
        ) : null}
      </div>

      <div className="text-xs text-white/40">{t("extension.note")}</div>
    </section>
  );
}
