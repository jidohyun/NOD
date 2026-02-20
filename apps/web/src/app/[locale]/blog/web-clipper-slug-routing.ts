const KO_WEB_CLIPPER_SLUG = "web-clipper-guide";
const GLOBAL_WEB_CLIPPER_SLUG = "chrome-web-clipper";

const WEB_CLIPPER_SLUG_SET = new Set([KO_WEB_CLIPPER_SLUG, GLOBAL_WEB_CLIPPER_SLUG]);

export function resolveWebClipperSlugForLocale(locale: string, slug: string): string {
  if (!WEB_CLIPPER_SLUG_SET.has(slug)) {
    return slug;
  }

  return locale === "ko" ? KO_WEB_CLIPPER_SLUG : GLOBAL_WEB_CLIPPER_SLUG;
}
