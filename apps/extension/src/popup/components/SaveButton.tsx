import { t } from "../../lib/i18n";

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SaveButton({
  onClick,
  disabled = false,
  loading = false,
}: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className="btn-gold cm-sketch-shadow mt-3 flex w-full items-center justify-center gap-2 py-2.5 text-sm font-extrabold tracking-[0.01em]"
    >
      {loading ? (
        <>
          <svg aria-hidden="true" focusable="false" className="icon-on-accent h-4 w-4 animate-spin opacity-75" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{t("extSaving")}</span>
        </>
      ) : (
        <>
          <svg aria-hidden="true" focusable="false" className="icon-on-accent h-4 w-4 opacity-85" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>{t("extSaveButton")}</span>
        </>
      )}
    </button>
  );
}
