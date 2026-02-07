import { t } from "../../lib/i18n";
import type { ExtractedContent } from "../../types/article";

interface ArticlePreviewProps {
  article: ExtractedContent;
}

export function ArticlePreview({ article }: ArticlePreviewProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3.5 shadow-sm">
      <div className="border-l-2 border-[#E8B931] pl-3">
        <h2 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
          {article.title}
        </h2>
        <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
          {article.excerpt}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="font-medium text-gray-500">{article.siteName}</span>
        <span>·</span>
        <span>{article.readingTime} {t("extMinRead")}</span>
        {article.author && (
          <>
            <span>·</span>
            <span className="truncate">{article.author}</span>
          </>
        )}
      </div>
    </div>
  );
}
