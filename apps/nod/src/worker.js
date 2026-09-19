const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const AUTH_CODE_TTL_MS = 2 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EXTENSION_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_JSON_BYTES = 16 * 1024;
const MAX_URL_LENGTH = 4_096;
const MAX_TITLE_LENGTH = 500;
const MAX_QUERY_LENGTH = 200;
const PAGE_SIZE = 30;

export class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function now() {
  return Date.now();
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlText(value) {
  return base64Url(new TextEncoder().encode(value));
}

function decodeBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new HttpError(400, "invalid_cursor");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new HttpError(400, "invalid_cursor");
  }
}

function randomSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

function randomId() {
  return crypto.randomUUID();
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

async function pkceChallenge(verifier) {
  return sha256(verifier);
}

function requiredString(value, maxLength, code) {
  if (typeof value !== "string") throw new HttpError(400, code);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new HttpError(400, code);
  return normalized;
}

function settings(env) {
  const configured = env.SITE_ORIGIN;
  if (typeof configured !== "string") throw new Error("Missing SITE_ORIGIN");

  const site = new URL(configured);
  const loopback = site.hostname === "localhost" || site.hostname === "127.0.0.1" || site.hostname === "[::1]";
  if ((site.protocol !== "https:" && !(site.protocol === "http:" && loopback)) || site.username || site.password || site.pathname !== "/" || site.search || site.hash) {
    throw new Error("Invalid SITE_ORIGIN");
  }
  if (!env.DB) throw new Error("Missing D1 binding");

  return {
    db: env.DB,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    origin: site.origin,
    callbackUri: `${site.origin}/auth/callback`,
    secureCookies: site.protocol === "https:",
  };
}

function isExtensionOrigin(origin) {
  return typeof origin === "string" && /^chrome-extension:\/\/[a-p]{32}$/.test(origin);
}

function extensionIdFromOrigin(origin) {
  return isExtensionOrigin(origin) ? origin.slice("chrome-extension://".length) : null;
}

function extensionIdFromRedirectUri(value) {
  if (typeof value !== "string" || value.length > 200) return null;
  const match = /^https:\/\/([a-p]{32})\.chromiumapp\.org\/$/.exec(value);
  return match ? match[1] : null;
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (!isExtensionOrigin(origin)) return new Headers();
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  });
}

function apiResponse(request, body, init = {}) {
  const headers = corsHeaders(request);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  for (const [name, value] of new Headers(init.headers)) headers.set(name, value);
  if (body !== null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(body === null ? null : JSON.stringify(body), { ...init, headers });
}

function apiError(request, status, code) {
  return apiResponse(request, { error: code }, { status });
}

function redirect(location, headers) {
  const resultHeaders = new Headers(headers);
  resultHeaders.set("Location", location);
  resultHeaders.set("Cache-Control", "no-store");
  resultHeaders.set("X-Content-Type-Options", "nosniff");
  return new Response(null, { status: 302, headers: resultHeaders });
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return null;
}

function sessionCookie(token, secureCookies) {
  return `nod_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secureCookies ? "; Secure" : ""}`;
}

function expiredSessionCookie(secureCookies) {
  return `nod_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureCookies ? "; Secure" : ""}`;
}

function oauthBindingCookie(binding, secureCookies) {
  return `nod_oauth_bind=${binding}; Path=/auth/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(OAUTH_STATE_TTL_MS / 1000)}${secureCookies ? "; Secure" : ""}`;
}

function expiredOauthBindingCookie(secureCookies) {
  return `nod_oauth_bind=; Path=/auth/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureCookies ? "; Secure" : ""}`;
}

function browserWriteAllowed(request, config) {
  return request.headers.get("Origin") === config.origin;
}

async function readBody(request, limit) {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null && (!/^\d+$/.test(contentLength) || Number(contentLength) > limit)) {
    throw new HttpError(413, "payload_too_large");
  }
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new HttpError(413, "payload_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function readJson(request) {
  const bytes = await readBody(request, MAX_JSON_BYTES);
  try {
    const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

export function normalizeUrl(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_URL_LENGTH) throw new HttpError(400, "invalid_url");
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new HttpError(400, "invalid_url");
  }
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || !parsed.hostname || parsed.username || parsed.password) {
    throw new HttpError(400, "invalid_url");
  }
  parsed.hash = "";
  const normalized = parsed.href;
  if (normalized.length > MAX_URL_LENGTH) throw new HttpError(400, "invalid_url");
  return { url: normalized, hostname: parsed.hostname };
}

function encodeCursor(article) {
  return base64UrlText(JSON.stringify({ createdAt: article.createdAt, id: article.id }));
}

function decodeCursor(value) {
  if (value.length > 512) throw new HttpError(400, "invalid_cursor");
  try {
    const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decodeBase64Url(value)));
    if (!parsed || !Number.isSafeInteger(parsed.createdAt) || parsed.createdAt < 0 || typeof parsed.id !== "string" || !/^[0-9a-f-]{36}$/i.test(parsed.id)) {
      throw new Error();
    }
    return parsed;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "invalid_cursor");
  }
}

function articleJson(row) {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    hostname: row.hostname,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

async function cookiePrincipal(request, config) {
  const rawToken = cookieValue(request, "nod_session");
  if (!rawToken || !/^[A-Za-z0-9_-]{43}$/.test(rawToken)) return null;
  const tokenHash = await sha256(rawToken);
  const row = await config.db.prepare(
    "SELECT users.id, users.name, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?"
  ).bind(tokenHash, now()).first();
  return row ? { kind: "cookie", user: row, tokenHash } : null;
}

async function authenticateApi(request, config) {
  const origin = request.headers.get("Origin");
  const authorization = request.headers.get("Authorization");
  if (authorization !== null) {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization);
    if (!match) return null;
    if (origin && origin !== config.origin && !isExtensionOrigin(origin)) return null;
    const tokenHash = await sha256(match[1]);
    const row = await config.db.prepare(
      "SELECT users.id, users.name, users.email FROM extension_tokens JOIN users ON users.id = extension_tokens.user_id WHERE extension_tokens.token_hash = ? AND extension_tokens.expires_at > ? AND extension_tokens.revoked_at IS NULL"
    ).bind(tokenHash, now()).first();
    return row ? { kind: "bearer", user: row, tokenHash } : null;
  }

  // A cookie is never an API credential for a cross-origin request.
  if (origin && origin !== config.origin) return null;
  return cookiePrincipal(request, config);
}

function requireCookieWrite(request, principal, config) {
  if (!principal || principal.kind !== "cookie") throw new HttpError(401, "unauthorized");
  if (!browserWriteAllowed(request, config)) throw new HttpError(403, "forbidden");
}

function requireArticleWrite(request, principal, config) {
  if (!principal) throw new HttpError(401, "unauthorized");
  if (principal.kind === "cookie" && !browserWriteAllowed(request, config)) throw new HttpError(403, "forbidden");
  if (principal.kind === "bearer") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== config.origin && !isExtensionOrigin(origin)) throw new HttpError(403, "forbidden");
  }
}

async function createOAuthState(config, fields) {
  const state = randomSecret();
  const stateHash = await sha256(state);
  const binding = randomSecret();
  const bindingHash = await sha256(binding);
  const verifier = randomSecret();
  const timestamp = now();
  await config.db.prepare(
    "INSERT INTO oauth_states (state_hash, browser_binding_hash, kind, pkce_verifier, extension_redirect_uri, extension_state, extension_code_challenge, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    stateHash,
    bindingHash,
    fields.kind,
    verifier,
    fields.redirectUri ?? null,
    fields.extensionState ?? null,
    fields.codeChallenge ?? null,
    timestamp + OAUTH_STATE_TTL_MS,
    timestamp,
  ).run();
  return { state, binding, verifier };
}
function requireGoogle(config) {
  if (!config.clientId || !config.clientSecret) throw new HttpError(503, "google_oauth_not_configured");
}

function googleAuthorizationUrl(config, state, challenge) {
  requireGoogle(config);
  const destination = new URL(GOOGLE_AUTHORIZE_URL);
  destination.searchParams.set("client_id", config.clientId);
  destination.searchParams.set("redirect_uri", config.callbackUri);
  destination.searchParams.set("response_type", "code");
  destination.searchParams.set("scope", "openid email profile");
  destination.searchParams.set("state", state);
  destination.searchParams.set("code_challenge", challenge);
  destination.searchParams.set("code_challenge_method", "S256");
  destination.searchParams.set("prompt", "select_account");
  return destination.href;
}

async function consumeOAuthState(request, config, state) {
  if (typeof state !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(state)) throw new HttpError(400, "invalid_state");
  const binding = cookieValue(request, "nod_oauth_bind");
  if (!binding || !/^[A-Za-z0-9_-]{43}$/.test(binding)) throw new HttpError(400, "invalid_state");
  const row = await config.db.prepare(
    "DELETE FROM oauth_states WHERE state_hash = ? AND browser_binding_hash = ? AND expires_at > ? RETURNING kind, pkce_verifier, extension_redirect_uri, extension_state, extension_code_challenge"
  ).bind(await sha256(state), await sha256(binding), now()).first();
  if (!row) throw new HttpError(400, "invalid_state");
  return row;
}

async function googleUserForCallback(request, config) {
  requireGoogle(config);
  const callback = new URL(request.url);
  const stateRecord = await consumeOAuthState(request, config, callback.searchParams.get("state"));
  const code = callback.searchParams.get("code");
  if (!code || code.length > 2_048 || callback.searchParams.has("error")) throw new HttpError(400, "oauth_failed");

  let tokenResponse;
  try {
    tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.callbackUri,
        grant_type: "authorization_code",
        code_verifier: stateRecord.pkce_verifier,
      }),
    });
  } catch {
    throw new HttpError(502, "oauth_failed");
  }
  if (!tokenResponse.ok) throw new HttpError(401, "oauth_failed");

  let tokenPayload;
  try {
    tokenPayload = await tokenResponse.json();
  } catch {
    throw new HttpError(502, "oauth_failed");
  }
  if (!tokenPayload || typeof tokenPayload.access_token !== "string" || tokenPayload.access_token.length > 8_192) {
    throw new HttpError(502, "oauth_failed");
  }

  let profileResponse;
  try {
    profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });
  } catch {
    throw new HttpError(502, "oauth_failed");
  }
  if (!profileResponse.ok) throw new HttpError(401, "oauth_failed");

  let profile;
  try {
    profile = await profileResponse.json();
  } catch {
    throw new HttpError(502, "oauth_failed");
  }
  if (!profile || typeof profile.sub !== "string" || profile.sub.length === 0 || profile.sub.length > 255 || typeof profile.email !== "string" || profile.email.length === 0 || profile.email.length > 320 || profile.email_verified !== true) {
    throw new HttpError(401, "oauth_failed");
  }
  const name = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim() : profile.email;
  if (name.length > 500) throw new HttpError(401, "oauth_failed");

  const timestamp = now();
  const freshUserId = randomId();
  await config.db.prepare(
    "INSERT INTO users (id, google_sub, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, updated_at = excluded.updated_at"
  ).bind(freshUserId, profile.sub, profile.email, name, timestamp, timestamp).run();
  const user = await config.db.prepare("SELECT id, name, email FROM users WHERE google_sub = ?").bind(profile.sub).first();
  if (!user) throw new Error("User upsert failed");
  return { stateRecord, user };
}

async function createSession(config, userId) {
  const token = randomSecret();
  await config.db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, now() + SESSION_TTL_MS, now()).run();
  return token;
}

async function createExtensionToken(config, userId) {
  const token = randomSecret();
  const timestamp = now();
  await config.db.prepare("INSERT INTO extension_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, timestamp + EXTENSION_TOKEN_TTL_MS, timestamp).run();
  return token;
}

async function issueExtensionAuthorizationCode(config, userId, redirectUri, codeChallenge) {
  const code = randomSecret();
  const timestamp = now();
  await config.db.prepare(
    "INSERT INTO extension_auth_codes (code_hash, user_id, redirect_uri, code_challenge, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(await sha256(code), userId, redirectUri, codeChallenge, timestamp + AUTH_CODE_TTL_MS, timestamp).run();
  return code;
}

function extensionRedirectUri(redirectUri, state, code) {
  const destination = new URL(redirectUri);
  destination.searchParams.set("code", code);
  destination.searchParams.set("state", state);
  return destination.href;
}

function extensionConsentPage(flowState, extensionId) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect NOD extension</title></head><body><main><h1>Connect NOD extension</h1><p>Allow the Chrome extension (${extensionId}) to save links to your NOD account?</p><form method="post" action="/auth/extension"><input type="hidden" name="flow_state" value="${flowState}"><button type="submit">Allow extension</button></form></main></body></html>`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'none'; form-action 'self' https://${extensionId}.chromiumapp.org; frame-ancestors 'none'; base-uri 'none'`,
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function handleAuth(request, config, path) {
  if (path === "/auth/google") {
    if (request.method !== "GET") throw new HttpError(405, "method_not_allowed");
    const existing = await cookiePrincipal(request, config);
    if (existing) return redirect(`${config.origin}/`);
    const oauth = await createOAuthState(config, { kind: "web" });
    return redirect(googleAuthorizationUrl(config, oauth.state, await pkceChallenge(oauth.verifier)), {
      "Set-Cookie": oauthBindingCookie(oauth.binding, config.secureCookies),
    });
  }

  if (path === "/auth/extension") {
    if (request.method === "POST") {
      if (!browserWriteAllowed(request, config)) throw new HttpError(403, "forbidden");
      const formBody = new TextDecoder().decode(await readBody(request, 2_048));
      const flowState = new URLSearchParams(formBody).get("flow_state");
      const existing = await cookiePrincipal(request, config);
      if (!existing) throw new HttpError(401, "unauthorized");
      const stateRecord = await consumeOAuthState(request, config, flowState);
      if (stateRecord.kind !== "extension") throw new HttpError(400, "invalid_extension_request");
      const code = await issueExtensionAuthorizationCode(config, existing.user.id, stateRecord.extension_redirect_uri, stateRecord.extension_code_challenge);
      return redirect(extensionRedirectUri(stateRecord.extension_redirect_uri, stateRecord.extension_state, code), {
        "Set-Cookie": expiredOauthBindingCookie(config.secureCookies),
      });
    }
    if (request.method !== "GET") throw new HttpError(405, "method_not_allowed");

    const requestUrl = new URL(request.url);
    const redirectUri = requestUrl.searchParams.get("redirect_uri");
    const extensionState = requestUrl.searchParams.get("state");
    const codeChallenge = requestUrl.searchParams.get("code_challenge");
    const extensionId = extensionIdFromRedirectUri(redirectUri);
    if (!extensionId || typeof extensionState !== "string" || extensionState.length === 0 || extensionState.length > 512 || typeof codeChallenge !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge)) {
      throw new HttpError(400, "invalid_extension_request");
    }

    const oauth = await createOAuthState(config, {
      kind: "extension",
      redirectUri,
      extensionState,
      codeChallenge,
    });
    const existing = await cookiePrincipal(request, config);
    if (existing) {
      const consent = extensionConsentPage(oauth.state, extensionId);
      consent.headers.append("Set-Cookie", oauthBindingCookie(oauth.binding, config.secureCookies));
      return consent;
    }
    return redirect(googleAuthorizationUrl(config, oauth.state, await pkceChallenge(oauth.verifier)), {
      "Set-Cookie": oauthBindingCookie(oauth.binding, config.secureCookies),
    });
  }

  if (path === "/auth/callback") {
    if (request.method !== "GET") throw new HttpError(405, "method_not_allowed");
    const { stateRecord, user } = await googleUserForCallback(request, config);
    if (stateRecord.kind === "extension") {
      const oauth = await createOAuthState(config, {
        kind: "extension",
        redirectUri: stateRecord.extension_redirect_uri,
        extensionState: stateRecord.extension_state,
        codeChallenge: stateRecord.extension_code_challenge,
      });
      const session = await createSession(config, user.id);
      const consent = extensionConsentPage(oauth.state, extensionIdFromRedirectUri(stateRecord.extension_redirect_uri));
      consent.headers.append("Set-Cookie", sessionCookie(session, config.secureCookies));
      consent.headers.append("Set-Cookie", oauthBindingCookie(oauth.binding, config.secureCookies));
      return consent;
    }
    const session = await createSession(config, user.id);
    const headers = new Headers();
    headers.append("Set-Cookie", sessionCookie(session, config.secureCookies));
    headers.append("Set-Cookie", expiredOauthBindingCookie(config.secureCookies));
    return redirect(`${config.origin}/`, headers);
  }

  throw new HttpError(404, "not_found");
}

async function listArticles(request, config, user) {
  const requestUrl = new URL(request.url);
  const q = requiredString(requestUrl.searchParams.get("q") ?? "", MAX_QUERY_LENGTH, "invalid_query");
  const cursorValue = requestUrl.searchParams.get("cursor");
  const cursor = cursorValue === null ? null : decodeCursor(cursorValue);
  const where = ["user_id = ?"];
  const bindings = [user.id];
  if (q) {
    where.push("(title LIKE ? ESCAPE '\\' OR url LIKE ? ESCAPE '\\')");
    const escaped = q.replace(/[\\%_]/g, "\\$&");
    bindings.push(`%${escaped}%`, `%${escaped}%`);
  }
  if (cursor) {
    where.push("(created_at < ? OR (created_at = ? AND id < ?))");
    bindings.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }
  bindings.push(PAGE_SIZE + 1);
  const rows = await config.db.prepare(
    `SELECT id, url, title, hostname, created_at AS createdAt FROM articles WHERE ${where.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT ?`
  ).bind(...bindings).all();
  const articleRows = rows.results ?? [];
  const hasMore = articleRows.length > PAGE_SIZE;
  const articles = articleRows.slice(0, PAGE_SIZE).map(articleJson);
  return apiResponse(request, {
    articles,
    nextCursor: hasMore ? encodeCursor(articleRows[PAGE_SIZE - 1]) : null,
  });
}

async function saveArticle(request, config, user) {
  const payload = await readJson(request);
  const { url, hostname } = normalizeUrl(payload.url);
  const title = requiredString(payload.title, MAX_TITLE_LENGTH, "invalid_title");
  const timestamp = now();
  const article = {
    id: randomId(),
    userId: user.id,
    url,
    title,
    hostname,
    createdAt: timestamp,
  };
  const result = await config.db.prepare(
    "INSERT OR IGNORE INTO articles (id, user_id, url, title, hostname, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(article.id, article.userId, article.url, article.title, article.hostname, article.createdAt).run();
  if (result.meta.changes === 1) return apiResponse(request, { article: articleJson(article), duplicate: false }, { status: 201 });

  const existing = await config.db.prepare(
    "SELECT id, url, title, hostname, created_at AS createdAt FROM articles WHERE user_id = ? AND url = ?"
  ).bind(user.id, url).first();
  if (!existing) throw new Error("Article conflict without stored article");
  return apiResponse(request, { article: articleJson(existing), duplicate: true });
}

async function deleteArticle(request, config, user, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "not_found");
  await config.db.prepare("DELETE FROM articles WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  return apiResponse(request, null, { status: 204 });
}

async function exchangeExtensionCode(request, config) {
  const origin = request.headers.get("Origin");
  const extensionId = extensionIdFromOrigin(origin);
  if (!extensionId) throw new HttpError(403, "forbidden");
  const payload = await readJson(request);
  const code = payload.code;
  const verifier = payload.code_verifier;
  const redirectUri = payload.redirect_uri;
  if (typeof code !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(code) || typeof verifier !== "string" || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || extensionIdFromRedirectUri(redirectUri) !== extensionId) {
    throw new HttpError(400, "invalid_extension_exchange");
  }

  const timestamp = now();
  const codeRecord = await config.db.prepare(
    "UPDATE extension_auth_codes SET used_at = ? WHERE code_hash = ? AND used_at IS NULL AND expires_at > ? AND redirect_uri = ? AND code_challenge = ? RETURNING user_id"
  ).bind(timestamp, await sha256(code), timestamp, redirectUri, await pkceChallenge(verifier)).first();
  if (!codeRecord) {
    throw new HttpError(400, "invalid_extension_exchange");
  }
  const token = await createExtensionToken(config, codeRecord.user_id);
  return apiResponse(request, { token });
}

async function handleApi(request, config, path) {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    if (!isExtensionOrigin(origin)) throw new HttpError(403, "forbidden");
    return apiResponse(request, null, { status: 204 });
  }

  if (path === "/api/extension/exchange") {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed");
    return exchangeExtensionCode(request, config);
  }

  const principal = await authenticateApi(request, config);
  if (path === "/api/me") {
    if (request.method !== "GET") throw new HttpError(405, "method_not_allowed");
    if (!principal) throw new HttpError(401, "unauthorized");
    return apiResponse(request, { user: principal.user });
  }

  if (path === "/api/logout") {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed");
    requireCookieWrite(request, principal, config);
    await config.db.prepare("DELETE FROM sessions WHERE token_hash = ? AND user_id = ?").bind(principal.tokenHash, principal.user.id).run();
    return apiResponse(request, null, { status: 204, headers: { "Set-Cookie": expiredSessionCookie(config.secureCookies) } });
  }

  if (path === "/api/extension-tokens/revoke") {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed");
    requireCookieWrite(request, principal, config);
    await config.db.prepare("UPDATE extension_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL").bind(now(), principal.user.id).run();
    return apiResponse(request, null, { status: 204 });
  }

  if (path === "/api/articles") {
    if (!principal) throw new HttpError(401, "unauthorized");
    if (request.method === "GET") return listArticles(request, config, principal.user);
    if (request.method === "POST") {
      requireArticleWrite(request, principal, config);
      return saveArticle(request, config, principal.user);
    }
    throw new HttpError(405, "method_not_allowed");
  }

  const articleMatch = /^\/api\/articles\/([^/]+)$/.exec(path);
  if (articleMatch) {
    if (request.method !== "DELETE") throw new HttpError(405, "method_not_allowed");
    if (!principal) throw new HttpError(401, "unauthorized");
    requireArticleWrite(request, principal, config);
    return deleteArticle(request, config, principal.user, articleMatch[1]);
  }

  throw new HttpError(404, "not_found");
}

export default {
  async fetch(request, env) {
    let requestUrl;
    try {
      requestUrl = new URL(request.url);
      if (requestUrl.pathname.startsWith("/auth/")) return await handleAuth(request, settings(env), requestUrl.pathname);
      if (requestUrl.pathname.startsWith("/api/")) return await handleApi(request, settings(env), requestUrl.pathname);
      if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") return apiError(request, 404, "not_found");
      const asset = await env.ASSETS.fetch(request);
      const response = new Response(asset.body, asset);
      response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    } catch (error) {
      if (error instanceof HttpError) return apiError(request, error.status, error.code);
      if (requestUrl?.pathname.startsWith("/api/")) return apiError(request, 500, "internal_error");
      return new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  },
};
