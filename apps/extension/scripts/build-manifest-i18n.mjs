import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(EXTENSION_ROOT, "..", "..");
const ARB_ROOT = path.resolve(REPO_ROOT, "packages/i18n/src");
const OUTPUT_ROOT = path.resolve(EXTENSION_ROOT, "dist/.generated/_locales");

const PHASE_ONE_LOCALES = ["en", "ko", "ja"];

const LOCALE_TO_CHROME = {
  en: "en",
  ko: "ko",
  ja: "ja",
  es: "es",
  "pt-BR": "pt_BR",
  "zh-CN": "zh_CN",
  de: "de",
  fr: "fr",
};

const REQUIRED_KEYS = [
  "extManifestName",
  "extManifestDescription",
  "extManifestNameDev",
  "extManifestDescriptionDev",
];

function readArb(locale) {
  const arbPath = path.resolve(ARB_ROOT, `${locale}.arb`);
  if (!fs.existsSync(arbPath)) {
    throw new Error(`Missing ARB file for locale "${locale}": ${arbPath}`);
  }

  return JSON.parse(fs.readFileSync(arbPath, "utf8"));
}

function getMessagesForLocale(locale) {
  const arb = readArb(locale);
  const missingKeys = REQUIRED_KEYS.filter((key) => typeof arb[key] !== "string");

  if (missingKeys.length > 0) {
    throw new Error(`Locale "${locale}" is missing manifest i18n keys: ${missingKeys.join(", ")}`);
  }

  return Object.fromEntries(
    REQUIRED_KEYS.map((key) => [
      key,
      {
        message: arb[key],
      },
    ]),
  );
}

function main() {
  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  for (const locale of PHASE_ONE_LOCALES) {
    const chromeLocale = LOCALE_TO_CHROME[locale];

    if (!chromeLocale) {
      throw new Error(`No Chrome locale mapping configured for "${locale}"`);
    }

    const outputDir = path.join(OUTPUT_ROOT, chromeLocale);
    const outputPath = path.join(outputDir, "messages.json");
    fs.mkdirSync(outputDir, { recursive: true });

    const messages = getMessagesForLocale(locale);
    fs.writeFileSync(outputPath, `${JSON.stringify(messages, null, 2)}\n`);
    console.log(`Created ${outputPath}`);
  }
}

main();
