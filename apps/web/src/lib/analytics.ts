type GtagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

export function trackEvent({ action, category, label, value }: GtagEvent) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}

export const AnalyticsEvents = {
  articleSaved: (source: string) =>
    trackEvent({ action: "article_saved", category: "articles", label: source }),

  articleDeleted: () => trackEvent({ action: "article_deleted", category: "articles" }),

  articleViewed: (articleId: string) =>
    trackEvent({ action: "article_viewed", category: "articles", label: articleId }),

  semanticSearch: (query: string) =>
    trackEvent({ action: "semantic_search", category: "search", label: query }),

  summaryViewed: (articleId: string) =>
    trackEvent({ action: "summary_viewed", category: "articles", label: articleId }),

  subscriptionUpgrade: (plan: string) =>
    trackEvent({ action: "subscription_upgrade", category: "billing", label: plan }),

  extensionInstalled: () => trackEvent({ action: "extension_installed", category: "onboarding" }),

  loginCompleted: (provider: string) =>
    trackEvent({ action: "login_completed", category: "auth", label: provider }),
} as const;
