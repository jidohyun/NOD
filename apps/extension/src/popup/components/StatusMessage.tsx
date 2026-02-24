import type { ReactNode } from "react";
import { WEB_BASE } from "../../lib/constants";
import { t } from "../../lib/i18n";
import type { ErrorCode } from "../../lib/errors";

interface RequestSentMessageProps {
  articleId: string;
}

interface SuccessMessageProps {
  articleId: string;
}

interface AlreadySavedMessageProps {
  articleId: string;
}

interface ErrorMessageProps {
  code: ErrorCode;
  message: string;
  onRetry?: () => void;
}

function openArticleTab(articleId: string) {
  chrome.tabs.create({ url: `${WEB_BASE}/articles/${articleId}` });
}

function StatusActionButton({
  label,
  href,
  onClick,
  accent = false,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const className = `cm-action-btn py-2 ${accent ? "t-accent" : "t-secondary"}`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

function StatusCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="glass-card animate-fade-in px-3.5 py-5 text-center">
      <div className="cm-icon-badge mx-auto mb-3 h-12 w-12">{icon}</div>
      <p className="text-sm font-extrabold tracking-[0.01em] t-primary">{title}</p>
      <p className="mt-1 text-xs leading-relaxed t-muted">{subtitle}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function RequestSentMessage({ articleId }: RequestSentMessageProps) {
  return (
    <StatusCard
      icon={
        <svg aria-hidden="true" className="h-6 w-6 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
      title={t("extSaveRequestSentTitle")}
      subtitle={t("extSaveRequestSentSubtitle")}
    >
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
      </div>
      <StatusActionButton
        label={t("extCheckDashboard")}
        onClick={() => openArticleTab(articleId)}
      />
    </StatusCard>
  );
}

export function AlreadySavedMessage({ articleId }: AlreadySavedMessageProps) {
  return (
    <StatusCard
      icon={
        <svg aria-hidden="true" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
        </svg>
      }
      title={t("extAlreadySavedTitle")}
      subtitle={t("extAlreadySavedSubtitle")}
    >
      <StatusActionButton
        label={t("extViewSavedArticle")}
        onClick={() => openArticleTab(articleId)}
      />
    </StatusCard>
  );
}

export function SuccessMessage({ articleId }: SuccessMessageProps) {
  return (
    <StatusCard
      icon={
        <svg aria-hidden="true" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      }
      title={t("extSaveSuccessTitle")}
      subtitle={t("extSaveSuccessSubtitle")}
    >
      <StatusActionButton
        label={t("extViewDashboard")}
        onClick={() => openArticleTab(articleId)}
      />
    </StatusCard>
  );
}

export function ErrorMessage({ code, message, onRetry }: ErrorMessageProps) {
  const isRecoverable = code !== "EXTRACT_FAILED";
  const isUsageLimited = code === "USAGE_LIMIT_REACHED";

  return (
    <StatusCard
      icon={
        <svg aria-hidden="true" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      title={t("extErrorTitle")}
      subtitle={message}
    >
      <p className="mb-3 text-xs opacity-70 t-muted">{t("extRefreshHint")}</p>
      {isUsageLimited ? (
        <StatusActionButton
          label={t("extUpgradePrompt")}
          href={`${WEB_BASE}/pricing`}
          accent
        />
      ) : isRecoverable && onRetry ? (
        <StatusActionButton label={t("extTryAgain")} onClick={onRetry} />
      ) : null}
    </StatusCard>
  );
}
