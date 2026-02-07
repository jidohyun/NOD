import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ArticleList } from "@/components/articles/article-list";

interface ArticlesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ArticlesPage({ params }: ArticlesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="space-y-8">
      <section>
        <ArticleList />
      </section>
    </div>
  );
}
