const VERSION_IDS = ["v1_3_3", "v1_3_0", "v1_2_0", "v1_1_0", "v1_0_0"] as const;
const HIGHLIGHT_IDS = ["item1", "item2", "item3", "item4"] as const;

const VERSION_SLUG_BY_ID: Record<(typeof VERSION_IDS)[number], string> = {
  v1_3_3: "v1-3-3",
  v1_3_0: "v1-3-x",
  v1_2_0: "v1-2-0",
  v1_1_0: "v1-1-0",
  v1_0_0: "v1-0-0",
};

interface TranslationGetter {
  (key: string): string;
  has: (key: string) => boolean;
}

interface ChangelogHighlight {
  title: string;
  description: string;
}

export interface ChangelogVersion {
  id: (typeof VERSION_IDS)[number];
  slug: string;
  detailHref: string;
  label: string;
  status: string;
  tagLabel: string;
  tag: string;
  publishedAtLabel: string;
  publishedAt: string;
  summary: string;
  highlightsTitle: string;
  patchNotes?: string;
  highlights: ChangelogHighlight[];
}

export function getChangelogVersions(t: TranslationGetter, locale: string): ChangelogVersion[] {
  return VERSION_IDS.map((versionId) => {
    const slug = VERSION_SLUG_BY_ID[versionId];

    return {
      id: versionId,
      slug,
      detailHref: `/${locale}/changelog/${slug}`,
      label: t(`versions.${versionId}.label`),
      status: t(`versions.${versionId}.status`),
      tagLabel: t(`versions.${versionId}.tagLabel`),
      tag: t(`versions.${versionId}.tag`),
      publishedAtLabel: t(`versions.${versionId}.publishedAtLabel`),
      publishedAt: t(`versions.${versionId}.publishedAt`),
      summary: t(`versions.${versionId}.summary`),
      highlightsTitle: t(`versions.${versionId}.highlightsTitle`),
      patchNotes: t.has(`versions.${versionId}.patchNotes`)
        ? t(`versions.${versionId}.patchNotes`)
        : undefined,
      highlights: HIGHLIGHT_IDS.map((highlightId) => ({
        title: t(`versions.${versionId}.highlights.${highlightId}.title`),
        description: t(`versions.${versionId}.highlights.${highlightId}.description`),
      })),
    };
  });
}
