const STORAGE_PREFIX = "fullstack_";

const STORAGE_KEYS = {
  ACCESS_TOKEN: `${STORAGE_PREFIX}access_token`,
  REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,
};

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setAccessToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }
}

export function setRefreshToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }
}

export function setTokens(tokens: AuthTokens): void {
  setAccessToken(tokens.access_token);
  setRefreshToken(tokens.refresh_token);
}

export function clearTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

export function hasTokens(): boolean {
  return Boolean(getAccessToken()) && Boolean(getRefreshToken());
}
