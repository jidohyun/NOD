// Content script: extracts article content and communicates with popup/background
import { extractContent, isArticlePage } from "./extractor";
import type { ContentScriptRequest, ContentScriptResponse } from "../types/api";

// Handle messages from popup
chrome.runtime.onMessage.addListener(
  (
    message: ContentScriptRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ContentScriptResponse) => void
  ) => {
    if (message.type === "EXTRACT_CONTENT") {
      try {
        const content = extractContent();
        sendResponse({ success: true, data: content });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      return true; // Keep message channel open for async
    }

    if (message.type === "CHECK_ARTICLE") {
      try {
        const isArticle = isArticlePage();
        if (isArticle) {
          const content = extractContent();
          sendResponse({ success: true, data: content });
        } else {
          sendResponse({
            success: false,
            error: "This page does not appear to be an article",
          });
        }
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      return true;
    }
  }
);

// Listen for auth token from web app
window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;

  if (event.data?.type === "NOD_AUTH_TOKEN" && event.data.token) {
    chrome.runtime.sendMessage({
      type: "SET_TOKEN",
      token: event.data.token,
    });
  }
});

// Log injection for debugging
console.log("[NOD] Content script loaded");
