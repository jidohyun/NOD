import { Readability } from "@mozilla/readability";
import type { ExtractedContent } from "../types/article";
import { MAX_CONTENT_LENGTH, EXCERPT_LENGTH, WORDS_PER_MINUTE } from "../lib/constants";

/**
 * Extract article content from the current page
 */
export function extractContent(): ExtractedContent {
  // PDF: send minimal content, let server extract
  if (document.contentType === "application/pdf") {
    return extractPDFContent();
  }

  // GitHub repository: use specialized extractor
  if (isGitHubRepo(window.location.href)) {
    return extractGitHubContent();
  }

  if (isYouTubeVideoPage(window.location.href)) {
    return extractYouTubeContent();
  }

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
    const sourceDocument = getSourceDocument();
    const documentClone = sourceDocument.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return null;
    }

    const content = article.textContent.trim();
    const wordCount = countWords(content);

    return {
      title: article.title || sourceDocument.title || "Untitled",
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
  const sourceDocument = getSourceDocument();
  // Try Open Graph title
  const ogTitle = sourceDocument.querySelector<HTMLMetaElement>(
    'meta[property="og:title"]'
  )?.content;
  if (ogTitle) return ogTitle;

  // Try h1
  const h1 = sourceDocument.querySelector("h1")?.textContent?.trim();
  if (h1) return h1;

  // Fallback to document title
  return sourceDocument.title || "Untitled";
}

/**
 * Extract main content using heuristics
 */
function extractMainContent(): string {
  const sourceDocument = getSourceDocument();
  // Priority: article > main > [role="main"] > body
  const contentElement =
    sourceDocument.querySelector("article") ||
    sourceDocument.querySelector("main") ||
    sourceDocument.querySelector('[role="main"]') ||
    sourceDocument.body;

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
  const sourceDocument = getSourceDocument();
  const ogSiteName = sourceDocument.querySelector<HTMLMetaElement>(
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
  const sourceDocument = getSourceDocument();
  const metaAuthor =
    sourceDocument.querySelector<HTMLMetaElement>('meta[name="author"]')?.content;
  if (metaAuthor) return metaAuthor;

  const articleAuthor = sourceDocument.querySelector<HTMLMetaElement>(
    'meta[property="article:author"]'
  )?.content;
  if (articleAuthor) return articleAuthor;

  return undefined;
}

/**
 * Extract published date from meta tags
 */
function extractPublishedDate(): string | undefined {
  const sourceDocument = getSourceDocument();
  const articleTime = sourceDocument.querySelector<HTMLMetaElement>(
    'meta[property="article:published_time"]'
  )?.content;
  if (articleTime) return articleTime;

  const datePublished = sourceDocument.querySelector<HTMLMetaElement>(
    'meta[property="datePublished"]'
  )?.content;
  if (datePublished) return datePublished;

  // Try time element
  const timeElement = sourceDocument.querySelector<HTMLTimeElement>("time[datetime]");
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
  // PDF pages: always treat as article (server-side extraction)
  if (document.contentType === "application/pdf") {
    return true;
  }

  if (!isEligiblePage()) {
    return false;
  }

  // GitHub repositories: allow if README-like content exists
  if (isGitHubRepo(window.location.href)) {
    return !!document.querySelector('article, [class*="markdown" i]');
  }

  if (isYouTubeVideoPage(window.location.href)) {
    return true;
  }

  const sourceDocument = getSourceDocument();
  // Check for article-like elements
  const hasArticle = !!sourceDocument.querySelector("article");
  const hasMain = !!sourceDocument.querySelector("main");

  // Check for article meta tags
  const hasOgArticle =
    sourceDocument.querySelector('meta[property="og:type"]')?.getAttribute("content") === "article";

  // Check content length
  const mainContent = extractMainContent();
  const wordCount = countWords(mainContent);
  const hasEnoughContent = wordCount > 100;

  return (hasArticle || hasMain || hasOgArticle) && hasEnoughContent;
}

function isEligiblePage(): boolean {
  // PDF documents are handled separately via isArticlePage() + extractPDFContent()
  if (document.contentType === "application/pdf") {
    return true;
  }

  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  // Don't attempt on homepages.
  if (url.pathname === "/") {
    return false;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (isBlockedHost(host)) {
    return false;
  }

  return true;
}

function isGitHubRepo(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "github.com") return false;
    // /{owner}/{repo} pattern (minimum 2 segments)
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

function isYouTubeVideoPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return parsed.pathname.length > 1;
    }

    if (host !== "youtube.com" && host !== "m.youtube.com") {
      return false;
    }

    if (parsed.pathname === "/watch") {
      return parsed.searchParams.has("v");
    }

    return (
      parsed.pathname.startsWith("/shorts/") ||
      parsed.pathname.startsWith("/live/")
    );
  } catch {
    return false;
  }
}

function extractGitHubContent(): ExtractedContent {
  const sourceDocument = getSourceDocument();

  // GitHub repo description
  const aboutSection =
    sourceDocument.querySelector('[class*="About"] p, .f4.my-3')?.textContent?.trim() || "";

  // README content - GitHub uses article tag or markdown class elements
  const readmeElement =
    sourceDocument.querySelector("article") ||
    sourceDocument.querySelector('[class*="markdown" i]');
  const readmeContent = readmeElement?.textContent?.replace(/\s+/g, " ").trim() || "";

  // Topics/tags
  const topics = Array.from(
    sourceDocument.querySelectorAll('a[data-octo-click="topic_click"]')
  )
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .join(", ");

  const content = [aboutSection, topics ? `Topics: ${topics}` : "", readmeContent]
    .filter(Boolean)
    .join("\n\n");

  const title = extractTitle();
  const wordCount = countWords(content);

  return {
    title,
    content: truncateContent(content),
    excerpt: createExcerpt(aboutSection || content),
    url: window.location.href,
    siteName: "GitHub",
    author: extractAuthor(),
    publishedAt: undefined,
    wordCount,
    readingTime: Math.ceil(wordCount / WORDS_PER_MINUTE),
  };
}

function extractYouTubeContent(): ExtractedContent {
  const url = window.location.href;
  const title = extractTitle();
  const siteName = new URL(url).hostname.replace("www.", "");

  return {
    title,
    content: "",
    excerpt: "YouTube video",
    url,
    siteName,
    author: extractAuthor(),
    publishedAt: extractPublishedDate(),
    wordCount: 0,
    readingTime: 0,
  };
}

function extractPDFContent(): ExtractedContent {
  const url = window.location.href;
  const title =
    document.title ||
    url.split("/").pop()?.replace(".pdf", "") ||
    "PDF Document";

  return {
    title,
    content: "",
    excerpt: "PDF document",
    url,
    siteName: new URL(url).hostname.replace("www.", ""),
    author: undefined,
    publishedAt: undefined,
    wordCount: 0,
    readingTime: 0,
  };
}

function isBlockedHost(host: string): boolean {
  // Based on Firefox Reader Mode blocked hosts.
  // https://raw.githubusercontent.com/mozilla/firefox/main/toolkit/components/reader/Readerable.js
  const blockedHosts = [
    "amazon.com",
    "mail.google.com",
    "pinterest.com",
    "reddit.com",
    "twitter.com",
    "x.com",
    "app.slack.com",
  ];

  return blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

function getSourceDocument(): Document {
  const hostname = window.location.hostname;
  const isNaverBlog = hostname === "blog.naver.com" || hostname.endsWith(".blog.naver.com");
  if (!isNaverBlog) return document;

  const iframe = document.querySelector<HTMLIFrameElement>("iframe#mainFrame");
  if (!iframe) return document;

  try {
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc?.body) return document;

    const text = iframeDoc.body.textContent?.replace(/\s+/g, " ").trim() || "";
    return text.length > 200 ? iframeDoc : document;
  } catch {
    return document;
  }
}
