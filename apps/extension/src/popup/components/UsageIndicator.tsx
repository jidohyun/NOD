import { t } from "../../lib/i18n";
import { WEB_BASE } from "../../lib/constants";
import type { UsageInfo } from "../../lib/api";

interface UsageIndicatorProps {
  usage: UsageInfo;
}

export function UsageIndicator({ usage }: UsageIndicatorProps) {
  const isSummaryUnlimited = usage.summaries_limit === -1;
  const isSummaryAtLimit = !isSummaryUnlimited && !usage.can_summarize;

  if (isSummaryUnlimited) {
    return (
      <div className="glass-card mt-3 animate-slide-up p-2.5">
        <div className="flex items-center gap-2 text-xs">
          <div className="cm-icon-badge h-5 w-5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 progress-glow" />
          </div>
          <span className="font-semibold t-secondary">{t("extUsageUnlimited")}</span>
        </div>
      </div>
    );
  }

  const summaryPercentage = Math.min(
    (usage.summaries_used / usage.summaries_limit) * 100,
    100
  );

  const summaryUsageText = t("extUsageInfo")
    .replace("{used}", String(usage.summaries_used))
    .replace("{limit}", String(usage.summaries_limit));

  const barColor = isSummaryAtLimit
    ? "bg-red-500"
    : summaryPercentage >= 80
      ? "bg-yellow-500"
      : "bg-emerald-400";

  return (
    <div className="glass-card mt-3 animate-slide-up space-y-2.5 p-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className={isSummaryAtLimit ? "font-semibold text-red-400" : "t-muted"}>
          {summaryUsageText}
        </span>
      </div>
      <div className="cm-doodle-border h-2 overflow-hidden" style={{ background: "var(--progress-track)" }}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${summaryPercentage}%` }}
        />
      </div>
      {isSummaryAtLimit ? (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-red-400">
            {t("extLimitReached")}
          </span>
          <a
            href={`${WEB_BASE}/pricing`}
            target="_blank"
            rel="noopener noreferrer"
            className="cm-action-btn w-auto px-2.5 py-1.5 text-xs t-accent"
          >
            {t("extUpgradePrompt")}
          </a>
        </div>
      ) : null}
    </div>
  );
}
