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
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
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

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={isAtLimit ? "text-red-400" : "text-gray-400"}>
          {usageText}
        </span>
      </div>
      <div className="h-1 rounded-full bg-gray-700">
        <div
          className={`h-1 rounded-full transition-all ${
            isAtLimit
              ? "bg-red-500"
              : percentage >= 80
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
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
            className="text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            {t("extUpgradePrompt")}
          </a>
        </div>
      )}
    </div>
  );
}
