import { Readability } from "@mozilla/readability";
import type { ExtractedContent } from "../types/article";
import { MAX_CONTENT_LENGTH, EXCERPT_LENGTH, WORDS_PER_MINUTE } from "../lib/constants";

/**
 * Extract article content from the current page
 */
export function extractContent(): ExtractedContent {
  // Try Readability first
  const readabilityResult = tryReadability();
  if (readabilityResult) {
    return readabilityResult;
  }

  // Fallback to heuristic extraction
  return heuristicExtraction();
}

/**
 * Extract using Mozilla Readability
 */
function tryReadability(): ExtractedContent | null {
  try {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return null;
    }

    const content = article.textContent.trim();
    const wordCount = countWords(content);

    return {
      title: article.title || document.title || "Untitled",
      content: truncateContent(content),
      excerpt: createExcerpt(content),
      url: window.location.href,
      siteName: extractSiteName(),
      author: extractAuthor(),
      publishedAt: extractPublishedDate(),
      wordCount,
      readingTime: Math.ceil(wordCount / WORDS_PER_MINUTE),
    };
  } catch {
    return null;
  }
}

/**
 * Fallback heuristic extraction
 */
function heuristicExtraction(): ExtractedContent {
  const title = extractTitle();
  const content = extractMainContent();
  const wordCount = countWords(content);

  return {
    title,
    content: truncateContent(content),
    excerpt: createExcerpt(content),
    url: window.location.href,
    siteName: extractSiteName(),
    author: extractAuthor(),
    publishedAt: extractPublishedDate(),
    wordCount,
    readingTime: Math.ceil(wordCount / WORDS_PER_MINUTE),
  };
}

/**
 * Extract page title
 */
function extractTitle(): string {
  // Try Open Graph title
  const ogTitle = document.querySelector<HTMLMetaElement>(
    'meta[property="og:title"]'
  )?.content;
  if (ogTitle) return ogTitle;

  // Try h1
  const h1 = document.querySelector("h1")?.textContent?.trim();
  if (h1) return h1;

  // Fallback to document title
  return document.title || "Untitled";
}

/**
 * Extract main content using heuristics
 */
function extractMainContent(): string {
  // Priority: article > main > [role="main"] > body
  const contentElement =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.querySelector('[role="main"]') ||
    document.body;

  const clone = contentElement.cloneNode(true) as HTMLElement;

  // Remove non-content elements
  const removeSelectors = [
    "script",
    "style",
    "nav",
    "footer",
    "header",
    "aside",
    "form",
    "iframe",
    ".ad",
    ".ads",
    ".advertisement",
    ".sidebar",
    ".comments",
    ".comment",
    ".social-share",
    ".related-posts",
    '[role="navigation"]',
    '[role="banner"]',
    '[role="complementary"]',
    '[aria-hidden="true"]',
  ];

  for (const selector of removeSelectors) {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  }

  return clone.textContent?.replace(/\s+/g, " ").trim() || "";
}

/**
 * Extract site name from meta tags
 */
function extractSiteName(): string {
  const ogSiteName = document.querySelector<HTMLMetaElement>(
    'meta[property="og:site_name"]'
  )?.content;
  if (ogSiteName) return ogSiteName;

  // Try hostname
  return window.location.hostname.replace("www.", "");
}

/**
 * Extract author from meta tags
 */
function extractAuthor(): string | undefined {
  const metaAuthor =
    document.querySelector<HTMLMetaElement>('meta[name="author"]')?.content;
  if (metaAuthor) return metaAuthor;

  const articleAuthor = document.querySelector<HTMLMetaElement>(
    'meta[property="article:author"]'
  )?.content;
  if (articleAuthor) return articleAuthor;

  return undefined;
}

/**
 * Extract published date from meta tags
 */
function extractPublishedDate(): string | undefined {
  const articleTime = document.querySelector<HTMLMetaElement>(
    'meta[property="article:published_time"]'
  )?.content;
  if (articleTime) return articleTime;

  const datePublished = document.querySelector<HTMLMetaElement>(
    'meta[property="datePublished"]'
  )?.content;
  if (datePublished) return datePublished;

  // Try time element
  const timeElement = document.querySelector<HTMLTimeElement>("time[datetime]");
  if (timeElement?.dateTime) return timeElement.dateTime;

  return undefined;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Create excerpt from content
 */
function createExcerpt(content: string): string {
  if (content.length <= EXCERPT_LENGTH) {
    return content;
  }
  return content.slice(0, EXCERPT_LENGTH).trim() + "...";
}

/**
 * Truncate content to max length
 */
function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }
  return content.slice(0, MAX_CONTENT_LENGTH);
}

/**
 * Check if current page is likely an article
 */
export function isArticlePage(): boolean {
  // Check for article-like elements
  const hasArticle = !!document.querySelector("article");
  const hasMain = !!document.querySelector("main");

  // Check for article meta tags
  const hasOgArticle =
    document.querySelector('meta[property="og:type"]')?.getAttribute("content") === "article";

  // Check content length
  const mainContent = extractMainContent();
  const wordCount = countWords(mainContent);
  const hasEnoughContent = wordCount > 100;

  return (hasArticle || hasMain || hasOgArticle) && hasEnoughContent;
}
