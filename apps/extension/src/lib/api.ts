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
