import { t } from "../../lib/i18n";
import type { ExtractedContent } from "../../types/article";

interface ArticlePreviewProps {
  article: ExtractedContent;
}

type ContentKind = "pdf" | "youtube" | "github" | "article";

function detectContentKind(url: string): ContentKind {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be"
    ) {
      return "youtube";
    }

    if (host === "github.com") {
      return "github";
    }

    if (parsed.pathname.toLowerCase().endsWith(".pdf")) {
      return "pdf";
    }
  } catch {
    // ignore
  }

  return "article";
}

function isPdfByContent(article: ExtractedContent): boolean {
  return (
    !article.content &&
    (article.excerpt === "PDF document" || article.excerpt === "PDF 문서")
  );
}

function ContentKindBadge({ kind }: { kind: ContentKind }) {
  const config = {
    pdf: { label: t("extPdfDocument"), icon: "📄", color: "text-red-400" },
    youtube: { label: t("extYoutubeVideo"), icon: "▶", color: "text-red-400" },
    github: { label: t("extGithubRepo"), icon: "⌨", color: "text-purple-400" },
    article: null,
  } as const;

  const badge = config[kind];
  if (!badge) return null;

  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs t-muted">
      <span className={badge.color}>{badge.icon}</span>
      <span>{badge.label}</span>
    </div>
  );
}

function ServerProcessedNote() {
  return (
    <p className="mt-1.5 text-[10px] leading-relaxed t-muted opacity-70">
      {t("extServerProcessed")}
    </p>
  );
}

export function ArticlePreview({ article }: ArticlePreviewProps) {
  const kind = isPdfByContent(article)
    ? "pdf"
    : detectContentKind(article.url);

  const isServerProcessed = kind === "pdf" || kind === "youtube";
  const showExcerpt =
    kind === "article" || kind === "github"
      ? !!article.excerpt
      : false;
  const showReadingTime = !isServerProcessed && article.readingTime > 0;

  return (
    <div className="glass-card animate-slide-up p-3.5">
      <h2 className="line-clamp-2 text-[13px] font-extrabold leading-[1.35] tracking-[0.01em] t-primary">
        {article.title}
      </h2>

      <ContentKindBadge kind={kind} />

      {showExcerpt && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed t-muted">
          {article.excerpt}
        </p>
      )}

      {isServerProcessed && <ServerProcessedNote />}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="cm-doodle-border bg-elevated px-2 py-0.5 font-semibold t-secondary">
          {article.siteName}
        </span>
        {showReadingTime && (
          <span className="cm-doodle-border px-2 py-0.5 t-muted">
            {article.readingTime} {t("extMinRead")}
          </span>
        )}
        {article.author ? (
          <span className="cm-doodle-border max-w-[140px] truncate px-2 py-0.5 t-muted">
            {article.author}
          </span>
        ) : null}
      </div>
    </div>
  );
}
