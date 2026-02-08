import { WEB_BASE } from "../../lib/constants";
import { t } from "../../lib/i18n";
import type { ErrorCode } from "../../lib/errors";

interface SuccessMessageProps {
  articleId: string;
}

export function SuccessMessage({ articleId }: SuccessMessageProps) {
  const handleViewArticle = () => {
    chrome.tabs.create({ url: `${WEB_BASE}/articles/${articleId}` });
  };

  return (
    <div className="flex flex-col items-center py-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="mb-0.5 text-sm font-semibold text-gray-900">{t("extSaveSuccessTitle")}</p>
      <p className="mb-4 text-xs text-gray-500">{t("extSaveSuccessSubtitle")}</p>
      <button
        onClick={handleViewArticle}
        className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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

  return (
    <div className="flex flex-col items-center py-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="mb-0.5 text-sm font-semibold text-gray-900">{t("extErrorTitle")}</p>
      <p className="mb-4 text-center text-xs text-gray-500">{message}</p>
      <p className="mb-4 text-center text-xs text-gray-500">{t("extRefreshHint")}</p>
      {isRecoverable && onRetry && (
        <button
          onClick={onRetry}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {t("extTryAgain")}
        </button>
      )}
    </div>
  );
}
