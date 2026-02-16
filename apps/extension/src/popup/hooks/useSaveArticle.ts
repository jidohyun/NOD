import { useState } from "react";
import { saveArticle } from "../../lib/api";
import { ExtensionError, type ErrorCode } from "../../lib/errors";
import type { ExtractedContent } from "../../types/article";

type SaveState =
  | "idle"
  | "saving"
  | "request_sent"
  | "already_saved"
  | "success"
  | "error";
type ArticleStatus = "processing" | "analyzed" | "failed";

interface UseSaveArticleResult {
  state: SaveState;
  articleId: string | null;
  articleStatus: ArticleStatus | null;
  error: { code: ErrorCode; message: string } | null;
  save: (content: ExtractedContent, summaryLanguage?: string) => Promise<void>;
  reset: () => void;
}

export function useSaveArticle(): UseSaveArticleResult {
  const [state, setState] = useState<SaveState>("idle");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [articleStatus, setArticleStatus] = useState<ArticleStatus | null>(null);
  const [error, setError] = useState<{
    code: ErrorCode;
    message: string;
  } | null>(null);

  async function save(content: ExtractedContent, summaryLanguage?: string) {
    setState("saving");
    setError(null);
    setArticleStatus(null);

    try {
      const result = await saveArticle({
        url: content.url,
        title: content.title,
        content: content.content,
        excerpt: content.excerpt,
        siteName: content.siteName,
        author: content.author,
        publishedAt: content.publishedAt,
        wordCount: content.wordCount,
        source: "extension",
        summary_language: summaryLanguage,
      });

      setArticleId(result.id);
      const normalizedStatus: ArticleStatus =
        result.status === "failed"
          ? "failed"
          : result.status === "processing"
            ? "processing"
            : "analyzed";
      setArticleStatus(normalizedStatus);

      if (result.already_saved) {
        setState("already_saved");
        return;
      }
      
      // Handle async flow - if status is processing, show request_sent state
      // otherwise show success (backward compatibility)
      if (result.status === "processing") {
        setState("request_sent");
      } else if (result.status === "failed") {
        setState("error");
        setError({
          code: "ANALYSIS_FAILED",
          message: "Article analysis failed. Please try again from the dashboard.",
        });
      } else {
        setState("success");
      }
    } catch (err) {
      if (err instanceof ExtensionError) {
        setError({ code: err.code, message: err.message });
      } else {
        setError({
          code: "UNKNOWN",
          message: err instanceof Error ? err.message : "Failed to save",
        });
      }
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setArticleId(null);
    setArticleStatus(null);
    setError(null);
  }

  return {
    state,
    articleId,
    articleStatus,
    error,
    save,
    reset,
  };
}
