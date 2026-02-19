import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

const TEST_MESSAGES = {
  dashboard: {
    sidebar: {
      nav: {
        dashboard: "Dashboard",
        articles: "Articles",
        settings: "Settings",
        billing: "Manage Billing",
        pricing: "Pricing",
      },
      user: {
        profile: "Profile",
        settings: "Settings",
        billing: "Manage Billing",
        help: "Help",
        logout: "Log out",
      },
    },
    overview: {
      title: "Dashboard",
      description: "Overview of your knowledge library.",
      savedArticles: "Saved Articles",
      aiSummaries: "AI Summaries",
      currentPlan: "Current Plan",
      viewArticlesTitle: "View Articles",
      viewArticlesDescription: "Browse and search your saved articles.",
      manageBillingTitle: "Manage Billing",
      manageBillingDescription: "View your plan and usage details.",
    },
    searchPlaceholder: "Search...",
    statusLabel: "Status",
    markdownNote: "Note",
    downloadMarkdown: "Download .md",
    myArticles: "My Articles",
    searchArticles: "Search articles...",
    allStatus: "All status",
    statusPending: "Pending",
    statusProcessing: "Processing",
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
    allContentTypes: "All Types",
    typeTechBlog: "Tech Blog",
    typePaper: "Paper",
    typeNews: "News",
    typeGitHub: "GitHub",
    typeDocs: "Docs",
    typeVideo: "Video/Podcast",
    semanticSearch: "AI Search",
    searchMinChars: "Type at least 2 characters to search",
    checkStatus: "Check Status",
    refreshing: "Refreshing...",
    retryAnalysis: "Retry",
    installExtensionCta: "Add to Chrome",
  },
  common: {
    loading: "Loading...",
    delete: "Delete",
  },
  subscription: {
    basic: "Basic",
    pro: "Pro",
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

function renderWithProviders(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: TestProviders, ...options });
}

export { renderWithProviders, createTestQueryClient, TestProviders };
