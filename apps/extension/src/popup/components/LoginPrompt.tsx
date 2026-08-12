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
    <div className="animate-fade-in pt-2">
      <div className="glass-card px-3.5 py-4 text-center">
        <div className="cm-icon-badge mx-auto mb-3 h-12 w-12 animate-glow-pulse">
          <svg aria-hidden="true" className="h-6 w-6 t-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>

        <h3 className="text-sm font-extrabold tracking-[0.01em] t-primary">{t("extLoginTitle")}</h3>
        <p className="mt-1 text-xs leading-relaxed t-muted">{t("extLoginSubtitle")}</p>

        <div className="cm-doodle-border mt-4 space-y-2.5 bg-surface px-3 py-2.5 text-left">
          <Feature text={t("extLoginFeature1")} />
          <Feature text={t("extLoginFeature2")} />
          <Feature text={t("extLoginFeature3")} />
        </div>

        <button type="button" onClick={handleLogin} className="btn-gold cm-sketch-shadow mt-4 w-full py-2.5 text-sm font-extrabold">
          {t("extLoginButton")}
        </button>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="cm-icon-badge h-5 w-5 flex-shrink-0">
        <svg aria-hidden="true" className="h-3 w-3 t-accent" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="text-xs t-secondary">{text}</span>
    </div>
  );
}
