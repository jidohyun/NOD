import { t } from "../../lib/i18n";
import type { ExtractedContent } from "../../types/article";

interface ArticlePreviewProps {
  article: ExtractedContent;
}

export function ArticlePreview({ article }: ArticlePreviewProps) {
  return (
    <div className="glass-card rounded-xl p-4 animate-slide-up">
      <div className="border-l-2 border-[#E8B931] pl-3.5">
        <h2 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug t-primary">
          {article.title}
        </h2>
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed t-muted">
          {article.excerpt}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs t-muted">
        <span className="font-medium t-secondary">{article.siteName}</span>
        <span style={{ opacity: 0.3 }}>·</span>
        <span>{article.readingTime} {t("extMinRead")}</span>
        {article.author && (
          <>
            <span style={{ opacity: 0.3 }}>·</span>
            <span className="truncate">{article.author}</span>
          </>
        )}
      </div>
    </div>
  );
}
