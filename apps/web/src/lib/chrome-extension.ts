const CHROME_EXTENSION_BASE_URL =
  "https://chromewebstore.google.com/detail/nod-article-analyzer/lifmaapjkbpfbdppiaeidcnicidpfknp";

const DEFAULT_HL = "en";
const SUPPORTED_HL = new Set(["en", "ko", "ja"]);

function resolveChromeWebStoreLanguage(locale?: string) {
  const language = locale?.toLowerCase().split("-")[0] ?? DEFAULT_HL;
  return SUPPORTED_HL.has(language) ? language : DEFAULT_HL;
}

export function getChromeExtensionInstallUrl(locale?: string) {
  const url = new URL(CHROME_EXTENSION_BASE_URL);
  url.searchParams.set("authuser", "0");
  url.searchParams.set("hl", resolveChromeWebStoreLanguage(locale));
  return url.toString();
}

export const CHROME_EXTENSION_INSTALL_URL = getChromeExtensionInstallUrl();
