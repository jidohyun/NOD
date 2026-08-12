"use client";

import { useTranslations } from "next-intl";
import { useUsage } from "@/lib/api/subscriptions";

export function UsageBar() {
  const t = useTranslations("subscription");
  const { data: usage, isLoading } = useUsage();

  if (isLoading || !usage) return null;

  const isUnlimited = usage.summaries_limit === -1;
  const percentage = isUnlimited
    ? 0
    : Math.min((usage.summaries_used / usage.summaries_limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && usage.summaries_used >= usage.summaries_limit;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{t("usage")}</span>
        <span className="text-xs text-muted-foreground">
          {isUnlimited
            ? t("unlimited")
            : t("summariesUsed", {
                used: usage.summaries_used,
                limit: usage.summaries_limit,
              })}
        </span>
      </div>
      {!isUnlimited ? (
        <div className="h-2 rounded-full bg-secondary">
          <div
            className={`h-2 rounded-full transition-all ${
              isAtLimit ? "bg-destructive" : isNearLimit ? "bg-yellow-500" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : null}
      {isAtLimit ? <p className="mt-2 text-xs text-destructive">{t("limitReached")}</p> : null}
    </div>
  );
}
