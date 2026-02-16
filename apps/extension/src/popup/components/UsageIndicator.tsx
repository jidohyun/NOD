import { t } from "../../lib/i18n";
import { WEB_BASE } from "../../lib/constants";
import type { UsageInfo } from "../../lib/api";

interface UsageIndicatorProps {
  usage: UsageInfo;
}

export function UsageIndicator({ usage }: UsageIndicatorProps) {
  const isSummaryUnlimited = usage.summaries_limit === -1;
  const isSummaryAtLimit = !isSummaryUnlimited && !usage.can_summarize;
  const isArticleUnlimited = usage.articles_limit === -1;
  const isArticleAtLimit = !isArticleUnlimited && !usage.can_save_article;

  if (isSummaryUnlimited && isArticleUnlimited) {
    return (
      <div className="flex items-center gap-1.5 text-xs t-muted">
        <div className="h-1.5 w-1.5 rounded-full bg-green-400 progress-glow" />
        <span>{t("extUsageUnlimited")}</span>
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

  const articleUsageText = t("extArticleUsageInfo")
    .replace("{used}", String(usage.articles_saved))
    .replace("{limit}", String(usage.articles_limit));

  const barColor = isSummaryAtLimit
    ? "bg-red-500"
    : summaryPercentage >= 80
      ? "bg-yellow-500"
      : "bg-emerald-400";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={isSummaryAtLimit ? "text-red-400" : "t-muted"}>
          {summaryUsageText}
        </span>
      </div>
      {!isSummaryUnlimited ? (
        <div className="h-1 overflow-hidden rounded-full" style={{ background: "var(--progress-track)" }}>
          <div
            className={`h-1 rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${summaryPercentage}%` }}
          />
        </div>
      ) : null}
      <div className="flex items-center justify-between text-xs">
        <span className={isArticleAtLimit ? "text-red-400" : "t-muted"}>
          {articleUsageText}
        </span>
      </div>
      {(isSummaryAtLimit || isArticleAtLimit) && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-400">
            {isArticleAtLimit ? t("extArticleLimitReached") : t("extLimitReached")}
          </span>
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
