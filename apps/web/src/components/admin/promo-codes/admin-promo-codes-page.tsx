"use client";

import type { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminPromoCodeCreatePayload,
  type AdminPromoCodeInfo,
  useAdminCreatePromoCode,
  useAdminDisablePromoCode,
  useAdminListPromoCodes,
} from "@/lib/api/subscriptions";

type AdminStatusFilter = "all" | "active" | "inactive";

function toIsoDateTimeOrNull(localDateTime: string): string | null {
  if (!localDateTime) {
    return null;
  }

  const value = new Date(localDateTime);
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString();
}

function mapCreateErrorToMessage(error: unknown, t: ReturnType<typeof useTranslations>): string {
  const axiosError = error as AxiosError<{ detail?: string }>;
  const detail = axiosError.response?.data?.detail;
  const status = axiosError.response?.status;
  if (status === 409 || detail === "promo_code_already_exists") {
    return t("adminPromo.errors.duplicate");
  }
  return t("adminPromo.errors.generic");
}

function mapDisableErrorToMessage(error: unknown, t: ReturnType<typeof useTranslations>): string {
  const axiosError = error as AxiosError<{ detail?: string }>;
  const detail = axiosError.response?.data?.detail;
  const status = axiosError.response?.status;
  if (status === 404 || detail === "promo_code_not_found") {
    return t("adminPromo.errors.notFound");
  }
  return t("adminPromo.errors.generic");
}

export function AdminPromoCodesPage() {
  const t = useTranslations("subscription");

  const [code, setCode] = useState("");
  const [grantDays, setGrantDays] = useState("30");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [campaignTag, setCampaignTag] = useState("");

  const [filterCampaignTag, setFilterCampaignTag] = useState("");
  const [appliedCampaignTag, setAppliedCampaignTag] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("all");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastIssuedCode, setLastIssuedCode] = useState("");

  const [disableTarget, setDisableTarget] = useState<AdminPromoCodeInfo | null>(null);
  const [disableReason, setDisableReason] = useState("");

  const listParams = useMemo(() => {
    const isActive = statusFilter === "all" ? undefined : statusFilter === "active";
    return {
      campaign_tag: appliedCampaignTag || undefined,
      is_active: isActive,
    };
  }, [appliedCampaignTag, statusFilter]);

  const { data: promoCodeList, isLoading, isError, refetch } = useAdminListPromoCodes(listParams);
  const createPromoCode = useAdminCreatePromoCode();
  const disablePromoCode = useAdminDisablePromoCode();

  const items = promoCodeList?.items ?? [];

  async function handleIssueCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const payload: AdminPromoCodeCreatePayload = {
      code: code.trim(),
      grant_days: Number.parseInt(grantDays, 10),
      per_user_limit: Number.parseInt(perUserLimit, 10),
      expires_at: toIsoDateTimeOrNull(expiresAt),
      max_redemptions: maxRedemptions ? Number.parseInt(maxRedemptions, 10) : null,
      campaign_tag: campaignTag.trim() || null,
    };

    try {
      await createPromoCode.mutateAsync(payload);
      setLastIssuedCode(code.trim().toUpperCase());
      setCode("");
      setSuccessMessage(t("adminPromo.success.created"));
      await refetch();
    } catch (error) {
      setErrorMessage(mapCreateErrorToMessage(error, t));
    }
  }

  async function handleDisableCode() {
    if (!disableTarget) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await disablePromoCode.mutateAsync(disableTarget.id);
      setDisableTarget(null);
      setDisableReason("");
      setSuccessMessage(t("adminPromo.success.disabled"));
      await refetch();
    } catch (error) {
      setErrorMessage(mapDisableErrorToMessage(error, t));
    }
  }

  async function handleCopyLatestCode() {
    if (!lastIssuedCode) {
      return;
    }
    await navigator.clipboard.writeText(lastIssuedCode);
    setSuccessMessage(t("adminPromo.success.copied"));
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-creative-display text-[clamp(2rem,3vw,3rem)] font-black text-cm-text">
          {t("adminPromo.title")}
        </h1>
        <p className="font-creative-body text-sm font-semibold text-cm-text/65">
          {t("adminPromo.description")}
        </p>
      </header>

      {successMessage ? (
        <div className="cm-doodle-border border-emerald-200 bg-emerald-50 p-3 text-sm font-creative-body font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="cm-doodle-border border-red-200 bg-red-50 p-3 text-sm font-creative-body font-bold text-red-600 dark:border-red-800 dark:bg-red-950/35 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <section className="cm-doodle-border bg-white/90 p-6 dark:bg-cm-surface/95">
        <h2 className="font-creative-display text-2xl font-black text-cm-text">
          {t("adminPromo.issue.title")}
        </h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleIssueCode}>
          <label className="space-y-1">
            <span className="text-xs font-creative-body font-black uppercase tracking-wider text-cm-text/55">
              {t("adminPromo.fields.code")}
            </span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              className="w-full rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text placeholder:text-cm-text/40 dark:border-cm-text/30 dark:bg-cm-surface-raised"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-creative-body font-black uppercase tracking-wider text-cm-text/55">
              {t("adminPromo.fields.grantDays")}
            </span>
            <input
              type="number"
              min={1}
              max={365}
              value={grantDays}
              onChange={(event) => setGrantDays(event.target.value)}
              required
              className="w-full rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text placeholder:text-cm-text/40 dark:border-cm-text/30 dark:bg-cm-surface-raised"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-creative-body font-black uppercase tracking-wider text-cm-text/55">
              {t("adminPromo.fields.expiresAt")}
            </span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="w-full rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text dark:border-cm-text/30 dark:bg-cm-surface-raised"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-creative-body font-black uppercase tracking-wider text-cm-text/55">
              {t("adminPromo.fields.maxRedemptions")}
            </span>
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(event) => setMaxRedemptions(event.target.value)}
              className="w-full rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text placeholder:text-cm-text/40 dark:border-cm-text/30 dark:bg-cm-surface-raised"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-creative-body font-black uppercase tracking-wider text-cm-text/55">
              {t("adminPromo.fields.perUserLimit")}
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={perUserLimit}
              onChange={(event) => setPerUserLimit(event.target.value)}
              required
              className="w-full rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text placeholder:text-cm-text/40 dark:border-cm-text/30 dark:bg-cm-surface-raised"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-creative-body font-black uppercase tracking-wider text-cm-text/55">
              {t("adminPromo.fields.campaignTag")}
            </span>
            <input
              value={campaignTag}
              onChange={(event) => setCampaignTag(event.target.value)}
              className="w-full rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text placeholder:text-cm-text/40 dark:border-cm-text/30 dark:bg-cm-surface-raised"
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={createPromoCode.isPending}
              className="cm-doodle-border bg-nod-gold px-4 py-2 text-sm font-creative-body font-black text-white transition-colors hover:bg-nod-gold-muted disabled:opacity-60"
            >
              {createPromoCode.isPending
                ? t("adminPromo.actions.issuing")
                : t("adminPromo.actions.issue")}
            </button>

            <button
              type="button"
              onClick={handleCopyLatestCode}
              disabled={!lastIssuedCode}
              className="cm-doodle-border bg-white px-4 py-2 text-sm font-creative-body font-black text-cm-text transition-colors hover:bg-cm-bg disabled:opacity-60 dark:bg-cm-surface-raised dark:hover:bg-cm-surface"
            >
              {t("adminPromo.actions.copyLatest")}
            </button>

            {lastIssuedCode ? (
              <p className="text-xs font-creative-body font-semibold text-cm-text/65">
                {t("adminPromo.latestCode", { code: lastIssuedCode })}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="cm-doodle-border bg-white/90 p-6 dark:bg-cm-surface/95">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="font-creative-display text-2xl font-black text-cm-text">
            {t("adminPromo.list.title")}
          </h2>
          <div className="grid gap-3 md:grid-cols-[220px_180px_auto]">
            <input
              placeholder={t("adminPromo.filters.campaignPlaceholder")}
              value={filterCampaignTag}
              onChange={(event) => setFilterCampaignTag(event.target.value)}
              className="rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text placeholder:text-cm-text/40 dark:border-cm-text/30 dark:bg-cm-surface-raised"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AdminStatusFilter)}
              className="rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text dark:border-cm-text/30 dark:bg-cm-surface-raised"
            >
              <option value="all">{t("adminPromo.filters.statusAll")}</option>
              <option value="active">{t("adminPromo.filters.statusActive")}</option>
              <option value="inactive">{t("adminPromo.filters.statusInactive")}</option>
            </select>

            <button
              type="button"
              onClick={() => setAppliedCampaignTag(filterCampaignTag.trim())}
              className="cm-doodle-border bg-cm-bg px-4 py-2 text-sm font-creative-body font-black text-cm-text transition-colors hover:bg-white dark:hover:bg-cm-surface-raised"
            >
              {t("adminPromo.filters.apply")}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}

        {isError ? (
          <p className="mt-4 text-sm font-creative-body font-semibold text-red-600">
            {t("adminPromo.errors.loadFailed")}
          </p>
        ) : null}

        {!isLoading && !isError ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-cm-text/15 px-3 py-2">
                    {t("adminPromo.table.campaign")}
                  </th>
                  <th className="border-b border-cm-text/15 px-3 py-2">
                    {t("adminPromo.table.status")}
                  </th>
                  <th className="border-b border-cm-text/15 px-3 py-2">
                    {t("adminPromo.table.grantDays")}
                  </th>
                  <th className="border-b border-cm-text/15 px-3 py-2">
                    {t("adminPromo.table.redeemed")}
                  </th>
                  <th className="border-b border-cm-text/15 px-3 py-2">
                    {t("adminPromo.table.created")}
                  </th>
                  <th className="border-b border-cm-text/15 px-3 py-2">
                    {t("adminPromo.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-cm-text/10 px-3 py-3">
                      {item.campaign_tag || t("adminPromo.table.none")}
                    </td>
                    <td className="border-b border-cm-text/10 px-3 py-3">
                      {item.is_active
                        ? t("adminPromo.table.active")
                        : t("adminPromo.table.inactive")}
                    </td>
                    <td className="border-b border-cm-text/10 px-3 py-3">{item.grant_days}</td>
                    <td className="border-b border-cm-text/10 px-3 py-3">
                      {item.redeemed_count}
                      {item.max_redemptions ? ` / ${item.max_redemptions}` : ""}
                    </td>
                    <td className="border-b border-cm-text/10 px-3 py-3">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="border-b border-cm-text/10 px-3 py-3">
                      <button
                        type="button"
                        disabled={!item.is_active}
                        onClick={() => setDisableTarget(item)}
                        className="cm-doodle-border bg-white px-3 py-1 text-xs font-creative-body font-black text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:bg-cm-surface-raised dark:hover:bg-red-950/30 dark:text-red-300"
                      >
                        {t("adminPromo.actions.disable")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {items.length === 0 ? (
              <p className="mt-4 text-sm font-creative-body font-semibold text-cm-text/65">
                {t("adminPromo.list.empty")}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {disableTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cm-text/40 p-4">
          <div className="cm-doodle-border w-full max-w-md bg-white p-5 dark:bg-cm-surface">
            <h3 className="font-creative-display text-2xl font-black text-cm-text">
              {t("adminPromo.disable.title")}
            </h3>
            <p className="mt-2 text-sm font-creative-body font-semibold text-cm-text/65">
              {t("adminPromo.disable.description")}
            </p>

            <label className="mt-4 block space-y-1">
              <span className="text-xs font-creative-body font-black uppercase tracking-wider text-cm-text/55">
                {t("adminPromo.disable.reason")}
              </span>
              <textarea
                value={disableReason}
                onChange={(event) => setDisableReason(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-cm-text/20 bg-white px-3 py-2 text-cm-text placeholder:text-cm-text/40 dark:border-cm-text/30 dark:bg-cm-surface-raised"
              />
            </label>

            <p className="mt-2 text-xs font-creative-body font-semibold text-cm-text/55">
              {t("adminPromo.disable.reasonNote")}
            </p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDisableTarget(null);
                  setDisableReason("");
                }}
                className="cm-doodle-border bg-white px-3 py-2 text-sm font-creative-body font-black text-cm-text transition-colors hover:bg-cm-bg dark:bg-cm-surface-raised dark:hover:bg-cm-surface"
              >
                {t("adminPromo.actions.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDisableCode}
                disabled={disablePromoCode.isPending}
                className="cm-doodle-border bg-red-500 px-3 py-2 text-sm font-creative-body font-black text-white disabled:opacity-60"
              >
                {disablePromoCode.isPending
                  ? t("adminPromo.actions.disabling")
                  : t("adminPromo.actions.confirmDisable")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
