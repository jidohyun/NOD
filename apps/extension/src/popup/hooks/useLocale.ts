import { useState, useEffect, useCallback } from "react";
import {
  getCurrentLocale,
  setLocale as setI18nLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "../../lib/i18n";
import { STORAGE_KEYS } from "../../lib/constants";

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getCurrentLocale());

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.LOCALE, (result) => {
      const saved = result[STORAGE_KEYS.LOCALE] as string | undefined;
      if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) {
        setI18nLocale(saved as Locale);
        setLocaleState(saved as Locale);
      }
    });
  }, []);

  const changeLocale = useCallback((newLocale: Locale) => {
    setI18nLocale(newLocale);
    setLocaleState(newLocale);
    chrome.storage.local.set({ [STORAGE_KEYS.LOCALE]: newLocale });
  }, []);

  return { locale, setLocale: changeLocale } as const;
}
