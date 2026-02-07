import { STORAGE_KEYS } from "./constants";

const { AUTH_TOKEN, TOKEN_EXPIRES, USER_INFO } = STORAGE_KEYS;

export interface UserInfo {
  email: string;
  name: string;
  avatarUrl: string;
}

/**
 * Decode JWT payload without verification (for display only)
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Extract user info from a Supabase JWT
 */
function extractUserInfo(token: string): UserInfo | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const meta = payload.user_metadata as Record<string, string> | undefined;
  const email = (payload.email as string) || meta?.email || "";
  const name = meta?.full_name || meta?.name || email.split("@")[0] || "";
  const avatarUrl = meta?.avatar_url || meta?.picture || "";

  return { email, name, avatarUrl };
}

/**
 * Get the current auth token
 */
export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get([AUTH_TOKEN, TOKEN_EXPIRES]);
  const token = result[AUTH_TOKEN];
  const expires = result[TOKEN_EXPIRES];

  if (expires && Date.now() > expires) {
    await clearToken();
    return null;
  }

  return token || null;
}

/**
 * Set the auth token and extract user info
 */
export async function setToken(
  token: string,
  expiresIn?: number
): Promise<void> {
  const data: Record<string, unknown> = { [AUTH_TOKEN]: token };

  if (expiresIn) {
    data[TOKEN_EXPIRES] = Date.now() + expiresIn * 1000;
  }

  const userInfo = extractUserInfo(token);
  if (userInfo) {
    data[USER_INFO] = userInfo;
  }

  await chrome.storage.local.set(data);
}

/**
 * Get stored user info
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  const result = await chrome.storage.local.get([USER_INFO]);
  return result[USER_INFO] || null;
}

/**
 * Clear the auth token and user info
 */
export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove([AUTH_TOKEN, TOKEN_EXPIRES, USER_INFO]);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
