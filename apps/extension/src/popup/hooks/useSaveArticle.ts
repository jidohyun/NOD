import { useState, useRef, useEffect, useCallback } from "react";
import { saveArticle, getArticleStatus } from "../../lib/api";
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

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_DURATION_MS = 180000; // 3 minutes

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

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollArticleStatus = useCallback(
    (id: string) => {
      const elapsed = Date.now() - pollStartRef.current;
      if (elapsed >= POLL_MAX_DURATION_MS) {
        // Timeout - stay on request_sent, user can check dashboard
        stopPolling();
        return;
      }

      pollTimerRef.current = setTimeout(async () => {
        try {
          const result = await getArticleStatus(id);
          const status = result.status as ArticleStatus;

          if (status === "analyzed") {
            stopPolling();
            setArticleStatus("analyzed");
            setState("success");
            return;
          }

          if (status === "failed") {
            stopPolling();
            setArticleStatus("failed");
            setState("error");
            setError({
              code: "ANALYSIS_FAILED",
              message: "Article analysis failed. Please try again from the dashboard.",
            });
            return;
          }

          // Still processing - continue polling
          pollArticleStatus(id);
        } catch {
          // Network error during poll - continue polling silently
          pollArticleStatus(id);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  // Cleanup on unmount
  useEffect(() => stopPolling, [stopPolling]);

  async function save(content: ExtractedContent, summaryLanguage?: string) {
    setState("saving");
    setError(null);
    setArticleStatus(null);
    stopPolling();

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

      if (result.status === "processing") {
        setState("request_sent");
        // Start polling for analysis result
        pollStartRef.current = Date.now();
        pollArticleStatus(result.id);
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
    stopPolling();
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
