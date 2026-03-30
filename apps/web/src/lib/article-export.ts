interface ArticleExportData {
  title: string;
  url: string | null;
  summary: string;
  markdown_note: string | null;
  key_points: string[];
  concepts: string[];
  reading_time_minutes: number | null;
  content_type: string;
  created_at: string;
}

export function formatArticleAsMarkdown(article: ArticleExportData): string {
  const sections: string[] = [];

  sections.push(`# ${article.title}`);

  const meta: string[] = [];
  if (article.url) {
    meta.push(`> Source: ${article.url}`);
  }
  meta.push(
    `> Saved with NOD on ${new Date(article.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
  );
  sections.push(meta.join("\n"));

  sections.push(`## Summary\n${article.summary}`);

  if (article.key_points.length > 0) {
    const points = article.key_points.map((p) => `- ${p}`).join("\n");
    sections.push(`## Key Points\n${points}`);
  }

  if (article.concepts.length > 0) {
    const tags = article.concepts.map((c) => `#${c.replace(/\s+/g, "_")}`).join(" ");
    sections.push(`## Concepts\n${tags}`);
  }

  if (article.markdown_note) {
    const normalized = article.markdown_note.replace(/\\n/g, "\n");
    sections.push(`## Notes\n${normalized}`);
  }

  const footer: string[] = [];
  if (article.reading_time_minutes) {
    footer.push(`Reading time: ${article.reading_time_minutes} min`);
  }
  footer.push(`Type: ${article.content_type}`);
  sections.push(`---\n${footer.join(" | ")}`);

  return sections.join("\n\n");
}
