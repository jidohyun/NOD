// Extracted content from a web page
export interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;
  url: string;
  siteName: string;
  author?: string;
  publishedAt?: string;
  wordCount: number;
  readingTime: number;
}

// Article summary for list display
export interface ArticleSummary {
  id: string;
  title: string;
  url: string;
  siteName: string;
  savedAt: string;
  summary?: string;
}

// Extension settings
export interface ExtensionSettings {
  autoExtract: boolean;
  showNotifications: boolean;
  theme: "light" | "dark" | "system";
}

// Pending article for offline sync
export interface PendingArticle {
  id: string;
  data: ExtractedContent;
  createdAt: string;
  retryCount: number;
}
