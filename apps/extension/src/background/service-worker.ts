// Background service worker: handles auth token storage, badge updates, and silent token refresh
import {
  setToken,
  clearToken,
  getRefreshToken,
  isAuthenticated,
} from "../lib/auth";
import {
  API_BASE,
  ALARM_TOKEN_REFRESH,
  TOKEN_REFRESH_BUFFER_MINUTES,
  STORAGE_KEYS,
} from "../lib/constants";

// ── Token Refresh ──────────────────────────────────────────────────────

function scheduleTokenRefresh(expiresIn: number): void {
  const delayMinutes = Math.max(expiresIn / 60 - TOKEN_REFRESH_BUFFER_MINUTES, 1);
  chrome.alarms.create(ALARM_TOKEN_REFRESH, { delayInMinutes: delayMinutes });
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearToken();
    await updateBadge();
    return false;
  }

  try {
    const resp = await fetch(`${API_BASE}/api/auth/extension-refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!resp.ok) {
      await clearToken();
      await updateBadge();
      return false;
    }

    const data = (await resp.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    await setToken(data.access_token, data.expires_in, data.refresh_token);
    scheduleTokenRefresh(data.expires_in);
    await updateBadge();
    return true;
  } catch {
    // Network failure — retry in 1 minute
    chrome.alarms.create(ALARM_TOKEN_REFRESH, { delayInMinutes: 1 });
    return false;
  }
}

async function restoreRefreshAlarm(): Promise<void> {
  // Check if an alarm is already scheduled — avoid duplicate work
  const existing = await chrome.alarms.get(ALARM_TOKEN_REFRESH);
  if (existing) return;

  const result = await chrome.storage.local.get([
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.TOKEN_EXPIRES,
    STORAGE_KEYS.REFRESH_TOKEN,
  ]);

  const hasAccessToken = !!result[STORAGE_KEYS.AUTH_TOKEN];
  const hasRefreshToken = !!result[STORAGE_KEYS.REFRESH_TOKEN];

  // Nothing to refresh
  if (!hasAccessToken && !hasRefreshToken) return;

  // Access token gone but refresh token still alive — refresh now
  if (!hasAccessToken && hasRefreshToken) {
    await refreshAccessToken();
    return;
  }

  const expires = result[STORAGE_KEYS.TOKEN_EXPIRES] as number | undefined;
  if (!expires) {
    // No expiry stored — schedule a refresh in 30 minutes as fallback
    chrome.alarms.create(ALARM_TOKEN_REFRESH, { delayInMinutes: 30 });
    return;
  }

  const remainingMs = expires - Date.now();
  if (remainingMs <= 0) {
    // Already expired — refresh immediately
    await refreshAccessToken();
  } else {
    const remainingSeconds = remainingMs / 1000;
    scheduleTokenRefresh(remainingSeconds);
  }
}

// ── Alarm Listener ─────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_TOKEN_REFRESH) {
    void refreshAccessToken();
  }
});

// ── Message Handlers ───────────────────────────────────────────────────

// From web app via externally_connectable
//
// NOTE: Cannot use async function here — Chrome requires a synchronous
// `return true` to keep the sendResponse port open.  An async function
// always returns a Promise, which Chrome ignores, closing the port before
// the awaited work finishes.
chrome.runtime.onMessageExternal.addListener(
  (message, _sender, sendResponse) => {
    if (message.type === "SET_TOKEN" && message.token) {
      setToken(message.token, message.expiresIn, message.refreshToken).then(
        () => {
          if (message.expiresIn) {
            scheduleTokenRefresh(message.expiresIn);
          }
          updateBadge();
          sendResponse({ success: true });
        }
      );
      return true;
    }
  }
);

// From content script and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SET_TOKEN" && message.token) {
    setToken(message.token, message.expiresIn, message.refreshToken).then(
      () => {
        if (message.expiresIn) {
          scheduleTokenRefresh(message.expiresIn);
        }
        updateBadge();
        sendResponse({ success: true });
      }
    );
    return true;
  }

  if (message.type === "GET_AUTH_STATUS") {
    isAuthenticated()
      .then((authed) => {
        sendResponse({ success: true, authenticated: authed });
      })
      .catch(() => {
        sendResponse({ success: false, authenticated: false });
      });
    return true;
  }

  // Handle refresh request from api.ts on 401
  if (message.type === "REFRESH_TOKEN") {
    refreshAccessToken()
      .then((success) => {
        sendResponse({ success });
      })
      .catch(() => {
        sendResponse({ success: false });
      });
    return true;
  }
});

// ── Badge ──────────────────────────────────────────────────────────────

async function updateBadge(): Promise<void> {
  const authed = await isAuthenticated();
  if (authed) {
    chrome.action.setBadgeText({ text: "" });
  } else {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
  void restoreRefreshAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
  void restoreRefreshAlarm();
});

// Service workers can go idle and restart at any time.  onInstalled and
// onStartup only fire on browser/extension lifecycle events, NOT when
// the worker wakes from idle.  Run restore at module-level so every
// wake-up re-checks the alarm state.
void restoreRefreshAlarm();
