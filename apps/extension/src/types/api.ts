// Environment Globals
declare global {
  const __DEV__: boolean;
  const __MODE__: string;
}

// API Request Types
export interface SaveArticleRequest {
  url: string;
  title: string;
  content: string;
  excerpt?: string;
  siteName?: string;
  author?: string;
  publishedAt?: string;
  wordCount?: number;
  source: "extension" | "web" | "api";
  summary_language?: string;
}

// API Response Types
export interface SaveArticleResponse {
  id: string;
  title: string;
  status: "processing" | "analyzed" | "completed" | "failed";
  already_saved?: boolean;
  summary?: {
    coreSummary: string;
    concepts: string[];
    keyPoints?: string[];
  };
  createdAt: string;
}

export interface RecentArticlesResponse {
  articles: Array<{
    id: string;
    title: string;
    url: string;
    siteName: string;
    savedAt: string;
    summary?: string;
  }>;
  total: number;
}

export interface SimilarArticlesResponse {
  articles: Array<{
    id: string;
    title: string;
    similarity: number;
    savedAt: string;
  }>;
}

// Message Types
export type ContentScriptRequest =
  | { type: "EXTRACT_CONTENT" }
  | { type: "CHECK_ARTICLE" };

export type ContentScriptResponse =
  | { success: true; data: import("./article").ExtractedContent }
  | { success: false; error: string };

export type BackgroundMessage =
  | { type: "SET_TOKEN"; token: string }
  | { type: "CLEAR_TOKEN" }
  | { type: "GET_AUTH_STATE" }
  | { type: "UPDATE_BADGE"; count?: number };
