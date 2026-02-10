import { WEB_BASE } from "../../lib/constants";
import { t } from "../../lib/i18n";

export function LoginPrompt() {
  const handleLogin = () => {
    const returnUrl = encodeURIComponent("/extension-auth");
    chrome.tabs.create({
      url: `${WEB_BASE}/login?redirect=${returnUrl}`,
    });
  };

  return (
    <div className="flex flex-col items-center pt-4 pb-2 animate-fade-in">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8B931]/10 animate-glow-pulse">
        <svg className="h-6 w-6 text-[#E8B931]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>

      <h3 className="mb-1 text-sm font-semibold t-primary">
        {t("extLoginTitle")}
      </h3>
      <p className="mb-4 text-xs t-muted">
        {t("extLoginSubtitle")}
      </p>

      <div className="glass-card mb-5 w-full space-y-2.5 rounded-xl p-3.5">
        <Feature text={t("extLoginFeature1")} />
        <Feature text={t("extLoginFeature2")} />
        <Feature text={t("extLoginFeature3")} />
      </div>

      <button
        onClick={handleLogin}
        className="btn-gold w-full rounded-xl py-2.5 text-sm"
      >
        {t("extLoginButton")}
      </button>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#E8B931]/15">
        <svg className="h-3 w-3 text-[#E8B931]" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="text-xs t-secondary">{text}</span>
    </div>
  );
}
