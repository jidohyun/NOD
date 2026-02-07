// Background service worker: handles auth token storage and badge updates
import { setToken, clearToken, isAuthenticated } from "../lib/auth";

// Listen for token from web app via externally_connectable
chrome.runtime.onMessageExternal.addListener(
  async (message, _sender, sendResponse) => {
    if (message.type === "SET_TOKEN" && message.token) {
      await setToken(message.token);
      await updateBadge();
      sendResponse({ success: true });
    }
    return true;
  }
);

// Listen for internal messages (from content script)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SET_TOKEN" && message.token) {
    setToken(message.token).then(() => {
      updateBadge();
      sendResponse({ success: true });
    });
    return true;
  }
});

async function updateBadge(): Promise<void> {
  const authed = await isAuthenticated();
  if (authed) {
    chrome.action.setBadgeText({ text: "" });
  } else {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  }
}

// Check auth on install
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});
