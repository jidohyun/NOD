import { useState } from "react";
import { saveArticle } from "../../lib/api";
import { ExtensionError, type ErrorCode } from "../../lib/errors";
import type { ExtractedContent } from "../../types/article";

type SaveState = "idle" | "saving" | "success" | "error";

interface UseSaveArticleResult {
  state: SaveState;
  articleId: string | null;
  error: { code: ErrorCode; message: string } | null;
  save: (content: ExtractedContent) => Promise<void>;
  reset: () => void;
}

export function useSaveArticle(): UseSaveArticleResult {
  const [state, setState] = useState<SaveState>("idle");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [error, setError] = useState<{
    code: ErrorCode;
    message: string;
  } | null>(null);

  async function save(content: ExtractedContent) {
    setState("saving");
    setError(null);

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
      });

      setArticleId(result.id);
      setState("success");
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
    setError(null);
  }

  return {
    state,
    articleId,
    error,
    save,
    reset,
  };
}
