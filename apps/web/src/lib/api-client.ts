import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const TOKEN_CACHE_TTL_MS = 5_000;

let cachedAccessToken: string | null = null;
let cachedAt = 0;
let inFlightTokenRequest: Promise<string | null> | null = null;

async function getAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && now - cachedAt < TOKEN_CACHE_TTL_MS) {
    return cachedAccessToken;
  }

  if (inFlightTokenRequest) {
    return inFlightTokenRequest;
  }

  inFlightTokenRequest = (async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    cachedAccessToken = token;
    cachedAt = Date.now();
    return token;
  })();

  try {
    return await inFlightTokenRequest;
  } finally {
    inFlightTokenRequest = null;
  }
}

export const apiClient = axios.create({
  baseURL: "/_proxy",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const supabase = createClient();
      const {
        data: { session },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (session?.access_token && !refreshError) {
        cachedAccessToken = session.access_token;
        cachedAt = Date.now();
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return apiClient(originalRequest);
      }

      cachedAccessToken = null;
      cachedAt = 0;

      // Refresh failed - sign out and redirect
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
