import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SharedArticleView } from "@/components/articles/shared-article-view";

interface UserSharePageProps {
  params: Promise<{ locale: string; username: string; slug: string }>;
}

export default async function UserSharePage({ params }: UserSharePageProps) {
  const { locale, username, slug } = await params;
  setRequestLocale(locale as Locale);

  return <SharedArticleView mode="username" username={username} slug={slug} />;
}
