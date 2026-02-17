import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../../lib/constants";

export type SummaryLanguage = "ko" | "en" | "ja";

const VALID_LANGUAGES: SummaryLanguage[] = ["ko", "en", "ja"];

export function useSummaryLanguage() {
  const [language, setLangState] = useState<SummaryLanguage>("en");

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.SUMMARY_LANGUAGE, (result) => {
      const saved = result[STORAGE_KEYS.SUMMARY_LANGUAGE] as string | undefined;
      if (saved && (VALID_LANGUAGES as string[]).includes(saved)) {
        setLangState(saved as SummaryLanguage);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: SummaryLanguage) => {
    setLangState(lang);
    chrome.storage.local.set({ [STORAGE_KEYS.SUMMARY_LANGUAGE]: lang });
  }, []);

  return { summaryLanguage: language, setSummaryLanguage: setLanguage } as const;
}
