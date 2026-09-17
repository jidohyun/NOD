const DEFAULT_ORIGIN = "https://nod-archive.com";
const TOKEN_PREFIX = "extensionToken:";
const STATUS_KEY = "lastResult";
const ORIGIN_KEY = "serviceOrigin";

let saveInProgress = false;

function normalizeOrigin(value) {
  const parsed = new URL(String(value).trim());
  const localhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";

  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("Use a service origin without a path, query, or credentials.");
  }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && localhost)) {
    throw new Error("The service origin must use HTTPS, except for local development on localhost.");
  }
  if (!["https://nod-archive.com", "http://localhost:8787"].includes(parsed.origin)) {
    throw new Error("Use https://nod-archive.com or http://localhost:8787; these are the permitted NOD servers.");
  }

  return parsed.origin;
}

async function getServiceOrigin() {
  const stored = await chrome.storage.local.get(ORIGIN_KEY);
  try {
    return normalizeOrigin(stored[ORIGIN_KEY] || DEFAULT_ORIGIN);
  } catch {
    return DEFAULT_ORIGIN;
  }
}

function tokenKey(origin) {
  return `${TOKEN_PREFIX}${origin}`;
}

async function getToken(origin) {
  const stored = await chrome.storage.local.get(tokenKey(origin));
  return stored[tokenKey(origin)] || null;
}

async function setToken(origin, token) {
  await chrome.storage.local.set({ [tokenKey(origin)]: token });
}

async function clearToken(origin) {
  await chrome.storage.local.remove(tokenKey(origin));
}

async function setResult(kind, message) {
  const status = { kind, message, at: new Date().toISOString() };
  await chrome.storage.local.set({ [STATUS_KEY]: status });

  const badge = kind === "saved" ? "✓" : kind === "duplicate" ? "=" : kind === "working" ? "…" : "!";
  const color = kind === "saved" ? "#137333" : kind === "duplicate" ? "#5f6368" : kind === "working" ? "#1a73e8" : "#b3261e";
  await chrome.action.setBadgeText({ text: badge });
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setTitle({ title: message });
  return status;
}

function randomBase64Url(bytes) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const value of values) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  let binary = "";
  for (const value of new Uint8Array(digest)) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getExtensionRedirectUri() {
  const redirectUri = chrome.identity.getRedirectURL();
  const parsed = new URL(redirectUri);
  if (
    parsed.protocol !== "https:" ||
    !/^[a-p]{32}\.chromiumapp\.org$/.test(parsed.hostname) ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error("Chrome returned an invalid extension redirect URI.");
  }
  return parsed.href;
}

async function readApiError(response, fallback) {
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error) return body.error;
  } catch {
    // The status below is sufficient when the response is not JSON.
  }
  return fallback;
}

async function fetchJson(origin, path, options = {}) {
  const response = await fetch(`${origin}${path}`, {
    credentials: "omit",
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = new Error(await readApiError(response, `NOD returned ${response.status}.`));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function connectAccount(origin) {
  await setResult("working", "Connecting your NOD account…");
  const redirectUri = getExtensionRedirectUri();
  const state = randomBase64Url(24);
  const verifier = randomBase64Url(48);
  const challenge = await sha256Base64Url(verifier);
  const authorizationUrl = new URL("/auth/extension", origin);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", challenge);

  const callbackUrl = await chrome.identity.launchWebAuthFlow({
    url: authorizationUrl.href,
    interactive: true
  });
  const callback = new URL(callbackUrl);

  if (callback.origin !== new URL(redirectUri).origin || callback.pathname !== "/") {
    throw new Error("Account connection returned to an unexpected location.");
  }
  if (callback.searchParams.get("state") !== state) {
    throw new Error("Account connection could not be verified. Please try again.");
  }
  const code = callback.searchParams.get("code");
  if (!code) {
    throw new Error("NOD did not return an authorization code.");
  }

  const result = await fetchJson(origin, "/api/extension/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: redirectUri })
  });
  if (typeof result?.token !== "string" || !result.token) {
    throw new Error("NOD returned an invalid extension credential.");
  }

  await setToken(origin, result.token);
  await setResult("saved", "NOD account connected.");
}

async function saveArticle(origin, token, article) {
  return fetchJson(origin, "/api/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(article)
  });
}

function isSaveableTab(tab) {
  return Boolean(tab?.url && /^https?:\/\//i.test(tab.url));
}

async function saveActiveTab(tab) {
  if (saveInProgress) {
    await setResult("error", "A NOD save is already in progress.");
    return;
  }
  if (!isSaveableTab(tab)) {
    await setResult("error", "NOD can only save normal HTTP or HTTPS pages.");
    return;
  }

  saveInProgress = true;
  const article = { url: tab.url, title: tab.title || tab.url };
  const origin = await getServiceOrigin();
  try {
    let token = await getToken(origin);
    if (!token) {
      await connectAccount(origin);
      token = await getToken(origin);
    }

    await setResult("working", "Saving this page to NOD…");
    const result = await saveArticle(origin, token, article);
    await setResult(
      result?.duplicate ? "duplicate" : "saved",
      result?.duplicate ? "Already saved to your NOD library." : "Saved to your NOD library."
    );
  } catch (error) {
    if (error?.status === 401) {
      await clearToken(origin);
      await setResult("error", "Your NOD connection expired. Reconnect in the extension options.");
    } else {
      await setResult("error", error instanceof Error ? error.message : "NOD could not save this page.");
    }
  } finally {
    saveInProgress = false;
  }
}

async function configureOrigin(value) {
  const origin = normalizeOrigin(value);
  const previousOrigin = await getServiceOrigin();
  await chrome.storage.local.set({ [ORIGIN_KEY]: origin });
  if (previousOrigin !== origin) await setResult("saved", "Service origin saved. Connect this NOD account to continue.");
  return origin;
}

async function disconnect(origin) {
  await clearToken(origin);
  await setResult("saved", "This browser is disconnected from NOD.");
}

chrome.action.onClicked.addListener((tab) => {
  void saveActiveTab(tab);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    const origin = await getServiceOrigin();
    switch (message?.type) {
      case "get-state": {
        const state = await chrome.storage.local.get([ORIGIN_KEY, STATUS_KEY, tokenKey(origin)]);
        sendResponse({ origin, status: state[STATUS_KEY] || null, connected: Boolean(state[tokenKey(origin)]) });
        break;
      }
      case "configure-origin":
        sendResponse({ origin: await configureOrigin(message.origin) });
        break;
      case "connect":
        await connectAccount(origin);
        sendResponse({ connected: true });
        break;
      case "disconnect":
        await disconnect(origin);
        sendResponse({ connected: false });
        break;
      default:
        throw new Error("Unknown extension request.");
    }
  })().catch(async (error) => {
    const messageText = error instanceof Error ? error.message : "The extension request failed.";
    await setResult("error", messageText);
    sendResponse({ error: messageText });
  });
  return true;
});
