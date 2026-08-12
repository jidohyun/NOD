import { useEffect, useState } from "react";
import { isAuthenticated, clearToken, getUserInfo } from "../../lib/auth";
import type { UserInfo } from "../../lib/auth";
import { STORAGE_KEYS } from "../../lib/constants";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserInfo | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    checkAuth();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.AUTH_TOKEN] || changes[STORAGE_KEYS.USER_INFO]) {
        checkAuth();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  async function checkAuth() {
    try {
      const authed = await isAuthenticated();
      const user = authed ? await getUserInfo() : null;
      setState({ isLoading: false, isAuthenticated: authed, user });
    } catch {
      setState({ isLoading: false, isAuthenticated: false, user: null });
    }
  }

  async function logout() {
    await clearToken();
    setState({ isLoading: false, isAuthenticated: false, user: null });
  }

  return {
    ...state,
    refresh: checkAuth,
    logout,
  };
}
