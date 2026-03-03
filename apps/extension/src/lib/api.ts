import { getToken, clearToken } from "./auth";
import { API_BASE } from "./constants";
import { ExtensionError } from "./errors";
import type { SaveArticleRequest, SaveArticleResponse } from "../types/api";

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  if (!token) {
    throw new ExtensionError("AUTH_EXPIRED", "Not authenticated", true);
  }

  // Check network
  if (!navigator.onLine) {
    throw ExtensionError.networkError();
  }

  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Attempt silent refresh before giving up
        const refreshResult = await new Promise<{ success: boolean }>(
          (resolve) => {
            chrome.runtime.sendMessage(
              { type: "REFRESH_TOKEN" },
              (resp) => {
                resolve(resp ?? { success: false });
              }
            );
          }
        );

        if (refreshResult.success) {
          // Retry the original request with the new token
          const newToken = await getToken();
          if (newToken) {
            const retryHeaders: HeadersInit = {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
              ...options.headers,
            };
            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
        }

        // Refresh failed — clear tokens
        await clearToken();
      }

      let errorMessage: string | undefined;
      try {
        const payload = (await response.clone().json()) as { detail?: string };
        if (typeof payload?.detail === "string" && payload.detail.trim().length > 0) {
          errorMessage = payload.detail;
        }
      } catch {
        errorMessage = undefined;
      }

      throw ExtensionError.fromResponse(response, errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ExtensionError) {
      throw error;
    }

    // Network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw ExtensionError.networkError();
    }

    throw new ExtensionError(
      "UNKNOWN",
      error instanceof Error ? error.message : "Request failed",
      true
    );
  }
}

/**
 * Save and analyze an article
 */
export async function saveArticle(
  input: SaveArticleRequest
): Promise<SaveArticleResponse> {
  return apiRequest<SaveArticleResponse>("/api/articles/analyze-url", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Get article status (for polling after save)
 */
export async function getArticleStatus(
  articleId: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`/api/articles/${articleId}`);
}

/**
 * Get recent articles
 */
export async function getRecentArticles(limit = 5) {
  return apiRequest<{
    articles: Array<{
      id: string;
      title: string;
      url: string;
      siteName: string;
      savedAt: string;
      summary?: string;
    }>;
    total: number;
  }>(`/api/articles/recent?limit=${limit}`);
}

/**
 * Get similar articles for a URL
 */
export async function getSimilarArticles(url: string) {
  const encoded = encodeURIComponent(url);
  return apiRequest<{
    articles: Array<{
      id: string;
      title: string;
      similarity: number;
      savedAt: string;
    }>;
  }>(`/api/articles/similar?url=${encoded}`);
}

/**
 * Get current usage info
 */
export interface UsageInfo {
  plan: string;
  status: string;
  summaries_used: number;
  summaries_limit: number;
  can_summarize: boolean;
}

export async function getUsageInfo(): Promise<UsageInfo> {
  return apiRequest<UsageInfo>("/api/subscriptions/usage");
}
