import type { ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

const TEST_MESSAGES = {
  dashboard: {
    myArticles: "My Articles",
    searchArticles: "Search articles...",
    allStatus: "All status",
    statusPending: "Pending",
    statusAnalyzing: "Analyzing",
    statusCompleted: "Completed",
    statusFailed: "Failed",
    loadingArticles: "Loading articles...",
    loadError: "Failed to load articles.",
    noArticles: "No articles yet. Save articles using the Chrome extension.",
    loadMore: "Load more",
    noSummary: "No summary available",
    articleNotFound: "Article not found.",
    deleteConfirm: "Delete this article?",
    original: "Original",
    pendingAnalysis: "Waiting for analysis to start...",
    analyzingArticle: "AI is analyzing this article...",
    summary: "Summary",
    readTime: "~{minutes} min read",
    concepts: "Concepts",
    keyPoints: "Key Points",
    analyzedBy: "Analyzed by {provider}/{model}",
    similarArticles: "Similar Articles",
    loadingSimilar: "Loading similar articles...",
    similarity: "{percent}% match",
  },
  common: {
    loading: "Loading...",
    delete: "Delete",
  },
  subscription: {
    usage: "Usage",
    unlimited: "Unlimited",
    summariesUsed: "{used}/{limit} summaries used",
    limitReached: "Limit reached",
  },
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <NextIntlClientProvider locale="en" messages={TEST_MESSAGES}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}

function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: TestProviders, ...options });
}

export { renderWithProviders, createTestQueryClient, TestProviders };
export { screen, within, waitFor } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
