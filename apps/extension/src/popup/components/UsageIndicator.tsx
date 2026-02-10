import { t } from "../../lib/i18n";
import { WEB_BASE } from "../../lib/constants";
import type { UsageInfo } from "../../lib/api";

interface UsageIndicatorProps {
  usage: UsageInfo;
}

export function UsageIndicator({ usage }: UsageIndicatorProps) {
  const isUnlimited = usage.summaries_limit === -1;
  const isAtLimit = !isUnlimited && !usage.can_summarize;

  if (isUnlimited) {
    return (
      <div className="flex items-center gap-1.5 text-xs t-muted">
        <div className="h-1.5 w-1.5 rounded-full bg-green-400 progress-glow" />
        <span>{t("extUsageUnlimited")}</span>
      </div>
    );
  }

  const percentage = Math.min(
    (usage.summaries_used / usage.summaries_limit) * 100,
    100
  );

  const usageText = t("extUsageInfo")
    .replace("{used}", String(usage.summaries_used))
    .replace("{limit}", String(usage.summaries_limit));

  const barColor = isAtLimit
    ? "bg-red-500"
    : percentage >= 80
      ? "bg-yellow-500"
      : "bg-emerald-400";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={isAtLimit ? "text-red-400" : "t-muted"}>
          {usageText}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full" style={{ background: "var(--progress-track)" }}>
        <div
          className={`h-1 rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-400">{t("extLimitReached")}</span>
          <a
            href={`${WEB_BASE}/pricing`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#E8B931] hover:opacity-80 transition-opacity"
          >
            {t("extUpgradePrompt")}
          </a>
        </div>
      )}
    </div>
  );
}
