import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ArticleDetail } from "@/components/articles/article-detail";

interface ArticleDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="mx-auto max-w-4xl">
      <ArticleDetail id={id} />
    </div>
  );
}
