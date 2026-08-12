export const locales = ["ko", "en", "ja", "es", "pt-BR", "zh-CN", "de", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";
