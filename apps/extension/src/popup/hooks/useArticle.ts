import { useEffect, useState, useCallback } from "react";
import type { ExtractedContent } from "../../types/article";
import type { ContentScriptResponse } from "../../types/api";

interface UseArticleResult {
  isLoading: boolean;
  article: ExtractedContent | null;
  error: string | null;
  refresh: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 600;

function isNaverBlog(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "blog.naver.com" || hostname.endsWith(".blog.naver.com");
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureContentScriptInjected(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-script.js"],
    });
  } catch {
    // Script might already be injected, which is fine
  }
}

export function useArticle(): UseArticleResult {
  const [isLoading, setIsLoading] = useState(true);
  const [article, setArticle] = useState<ExtractedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id || !tab.url) {
        setError("Could not access current tab");
        setIsLoading(false);
        return;
      }

      const tabUrl = tab.url;
      if (!tabUrl.startsWith("http://") && !tabUrl.startsWith("https://")) {
        setError("Could not extract content from this page");
        setIsLoading(false);
        return;
      }

      await ensureContentScriptInjected(tab.id);

      const needsRetry = isNaverBlog(tabUrl);
      let lastError: string | null = null;

      for (let attempt = 0; attempt < (needsRetry ? MAX_RETRIES : 1); attempt++) {
        try {
          const response: ContentScriptResponse = await chrome.tabs.sendMessage(
            tab.id,
            { type: "CHECK_ARTICLE" }
          );

          if (response?.success) {
            setArticle(response.data);
            setIsLoading(false);
            return;
          }
          lastError = response?.error || "Failed to extract content";
        } catch {
          lastError = "Could not extract content from this page";
        }

        if (attempt < MAX_RETRIES - 1) {
          await delay(RETRY_DELAY_MS);
        }
      }

      setError(lastError || "Could not extract content from this page");
    } catch {
      setError("Could not extract content from this page");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    extractContent();
  }, [extractContent]);

  return {
    isLoading,
    article,
    error,
    refresh: extractContent,
  };
}
