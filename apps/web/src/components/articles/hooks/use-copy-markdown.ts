import { useCallback, useEffect, useRef, useState } from "react";
import { AnalyticsEvents } from "@/lib/analytics";
import { formatArticleAsMarkdown } from "@/lib/article-export";

interface ArticleData {
  id: string;
  title: string;
  url: string | null;
  created_at: string;
  summary: {
    summary: string;
    markdown_note?: string | null;
    key_points: string[];
    concepts: string[];
    reading_time_minutes: number | null;
    content_type?: string;
  } | null;
}

type CopyState = "idle" | "copied" | "error";

const FEEDBACK_DURATION_MS = 2000;

export function useCopyMarkdown(article: ArticleData | undefined) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const resetStateAfterDelay = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setCopyState("idle");
      timerRef.current = null;
    }, FEEDBACK_DURATION_MS);
  }, []);

  const copyMarkdown = useCallback(async () => {
    if (!article?.summary) return;

    const contentType = article.summary.content_type ?? "general_news";
    const markdown = formatArticleAsMarkdown({
      title: article.title,
      url: article.url,
      summary: article.summary.summary,
      markdown_note: article.summary.markdown_note ?? null,
      key_points: article.summary.key_points,
      concepts: article.summary.concepts,
      reading_time_minutes: article.summary.reading_time_minutes,
      content_type: contentType,
      created_at: article.created_at,
    });

    try {
      await navigator.clipboard.writeText(markdown);
      setCopyState("copied");
      AnalyticsEvents.markdownCopied(article.id, contentType);
    } catch {
      setCopyState("error");
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    resetStateAfterDelay();
  }, [article, resetStateAfterDelay]);

  return { copyState, copyMarkdown } as const;
}
