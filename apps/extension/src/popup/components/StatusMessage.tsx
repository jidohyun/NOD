import { WEB_BASE } from "../../lib/constants";
import { t } from "../../lib/i18n";
import type { ErrorCode } from "../../lib/errors";

interface RequestSentMessageProps {
  articleId: string;
}

export function RequestSentMessage({ articleId }: RequestSentMessageProps) {
  const handleViewArticle = () => {
    chrome.tabs.create({ url: `${WEB_BASE}/articles/${articleId}` });
  };

  return (
    <div className="flex flex-col items-center py-6 animate-fade-in">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--icon-info-bg, rgba(59, 130, 246, 0.15))" }}>
        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <p className="mb-0.5 text-sm font-semibold t-primary">{t("extSaveRequestSentTitle")}</p>
      <p className="mb-4 text-xs t-muted">{t("extSaveRequestSentSubtitle")}</p>
      <button
        onClick={handleViewArticle}
        className="w-full rounded-xl py-2 text-sm font-medium t-secondary transition-all"
        style={{
          border: "1px solid var(--border-default)",
          background: "var(--bg-elevated)",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
      >
        {t("extCheckDashboard")}
      </button>
    </div>
  );
}

interface SuccessMessageProps {
  articleId: string;
}

interface AlreadySavedMessageProps {
  articleId: string;
}

export function AlreadySavedMessage({ articleId }: AlreadySavedMessageProps) {
  const handleViewArticle = () => {
    chrome.tabs.create({ url: `${WEB_BASE}/articles/${articleId}` });
  };

  return (
    <div className="flex flex-col items-center py-6 animate-fade-in">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--icon-info-bg, rgba(59, 130, 246, 0.15))" }}>
        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
        </svg>
      </div>
      <p className="mb-0.5 text-sm font-semibold t-primary">{t("extAlreadySavedTitle")}</p>
      <p className="mb-4 text-xs t-muted">{t("extAlreadySavedSubtitle")}</p>
      <button
        onClick={handleViewArticle}
        className="w-full rounded-xl py-2 text-sm font-medium t-secondary transition-all"
        style={{
          border: "1px solid var(--border-default)",
          background: "var(--bg-elevated)",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
      >
        {t("extViewSavedArticle")}
      </button>
    </div>
  );
}

export function SuccessMessage({ articleId }: SuccessMessageProps) {
  const handleViewArticle = () => {
    chrome.tabs.create({ url: `${WEB_BASE}/articles/${articleId}` });
  };

  return (
    <div className="flex flex-col items-center py-6 animate-fade-in">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--icon-success-bg)" }}>
        <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="mb-0.5 text-sm font-semibold t-primary">{t("extSaveSuccessTitle")}</p>
      <p className="mb-4 text-xs t-muted">{t("extSaveSuccessSubtitle")}</p>
      <button
        onClick={handleViewArticle}
        className="w-full rounded-xl py-2 text-sm font-medium t-secondary transition-all"
        style={{
          border: "1px solid var(--border-default)",
          background: "var(--bg-elevated)",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
      >
        {t("extViewDashboard")}
      </button>
    </div>
  );
}

interface ErrorMessageProps {
  code: ErrorCode;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ code, message, onRetry }: ErrorMessageProps) {
  const isRecoverable = code !== "EXTRACT_FAILED";
  const isUsageLimited = code === "USAGE_LIMIT_REACHED";

  return (
    <div className="flex flex-col items-center py-6 animate-fade-in">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--icon-error-bg)" }}>
        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="mb-0.5 text-sm font-semibold t-primary">{t("extErrorTitle")}</p>
      <p className="mb-2 text-center text-xs t-muted">{message}</p>
      <p className="mb-4 text-center text-xs t-muted" style={{ opacity: 0.6 }}>{t("extRefreshHint")}</p>
      {isUsageLimited ? (
        <a
          href={`${WEB_BASE}/pricing`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-xl py-2 text-sm font-medium text-center text-[#E8B931] transition-opacity hover:opacity-80"
          style={{ border: "1px solid var(--border-default)", background: "var(--bg-elevated)" }}
        >
          {t("extUpgradePrompt")}
        </a>
      ) : isRecoverable && onRetry ? (
        <button
          onClick={onRetry}
          className="w-full rounded-xl py-2 text-sm font-medium t-secondary transition-all"
          style={{
            border: "1px solid var(--border-default)",
            background: "var(--bg-elevated)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
        >
          {t("extTryAgain")}
        </button>
      ) : null}
    </div>
  );
}
