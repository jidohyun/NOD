import { useEffect, useState } from "react";
import type { ExtractedContent } from "../../types/article";
import type { ContentScriptResponse } from "../../types/api";

interface UseArticleResult {
  isLoading: boolean;
  article: ExtractedContent | null;
  error: string | null;
  refresh: () => void;
}

export function useArticle(): UseArticleResult {
  const [isLoading, setIsLoading] = useState(true);
  const [article, setArticle] = useState<ExtractedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function extractContent() {
    setIsLoading(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        setError("Could not access current tab");
        setIsLoading(false);
        return;
      }

      const response: ContentScriptResponse = await chrome.tabs.sendMessage(
        tab.id,
        { type: "EXTRACT_CONTENT" }
      );

      if (response?.success) {
        setArticle(response.data);
      } else {
        setError(response?.error || "Failed to extract content");
      }
    } catch (err) {
      // Content script might not be loaded on this page
      setError("Could not extract content from this page");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    extractContent();
  }, []);

  return {
    isLoading,
    article,
    error,
    refresh: extractContent,
  };
}
