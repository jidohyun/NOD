import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ArticleDetail } from "@/components/articles/article-detail";
import { SimilarArticles } from "@/components/articles/similar-articles";

interface ArticleDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <ArticleDetail id={id} />
      <aside className="space-y-4">
        <SimilarArticles articleId={id} />
      </aside>
    </div>
  );
}
