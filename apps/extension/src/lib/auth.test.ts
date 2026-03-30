import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearToken,
  getRefreshToken,
  getToken,
  getUserInfo,
  isAuthenticated,
  setToken,
} from "./auth";
import { STORAGE_KEYS } from "./constants";

const storage = new Map<string, unknown>();

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(payload: Record<string, unknown>): string {
  return [
    encodeBase64Url(JSON.stringify({ alg: "none", typ: "JWT" })),
    encodeBase64Url(JSON.stringify(payload)),
    "signature",
  ].join(".");
}

vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: vi.fn(async (keys: string[]) => {
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (storage.has(key)) {
            result[key] = storage.get(key);
          }
        }
        return result;
      }),
      set: vi.fn(async (data: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(data)) {
          storage.set(key, value);
        }
      }),
      remove: vi.fn(async (keys: string[]) => {
        for (const key of keys) {
          storage.delete(key);
        }
      }),
    },
  },
});

describe("auth helpers", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("stores token, refresh token, and extracted user info", async () => {
    const token = createJwt({
      email: "hello@example.com",
      user_metadata: {
        full_name: "Hello",
        avatar_url: "https://example.com/avatar.png",
      },
    });

    await setToken(token, 60, "refresh-123");

    expect(storage.get(STORAGE_KEYS.AUTH_TOKEN)).toBe(token);
    expect(storage.get(STORAGE_KEYS.REFRESH_TOKEN)).toBe("refresh-123");
    expect(storage.get(STORAGE_KEYS.USER_INFO)).toEqual({
      email: "hello@example.com",
      name: "Hello",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("returns null and clears only expired access token fields", async () => {
    storage.set(STORAGE_KEYS.AUTH_TOKEN, "expired-token");
    storage.set(STORAGE_KEYS.TOKEN_EXPIRES, Date.now() - 1000);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, "refresh-still-there");

    await expect(getToken()).resolves.toBeNull();
    expect(storage.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(storage.has(STORAGE_KEYS.TOKEN_EXPIRES)).toBe(false);
    expect(storage.get(STORAGE_KEYS.REFRESH_TOKEN)).toBe("refresh-still-there");
  });

  it("re-extracts and returns user info from stored token", async () => {
    const token = createJwt({
      email: "person@example.com",
      user_metadata: {
        name: "Person",
        picture: "https://example.com/p.png",
      },
    });
    storage.set(STORAGE_KEYS.AUTH_TOKEN, token);

    await expect(getUserInfo()).resolves.toEqual({
      email: "person@example.com",
      name: "Person",
      avatarUrl: "https://example.com/p.png",
    });
  });

  it("reports auth state and clears all auth keys", async () => {
    storage.set(STORAGE_KEYS.AUTH_TOKEN, "active-token");
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, "refresh-token");

    await expect(isAuthenticated()).resolves.toBe(true);
    await expect(getRefreshToken()).resolves.toBe("refresh-token");

    await clearToken();

    await expect(isAuthenticated()).resolves.toBe(false);
    expect(storage.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(storage.has(STORAGE_KEYS.REFRESH_TOKEN)).toBe(false);
    expect(storage.has(STORAGE_KEYS.USER_INFO)).toBe(false);
  });
});
