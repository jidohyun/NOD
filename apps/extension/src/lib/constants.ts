// API Configuration
export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const WEB_BASE =
  import.meta.env.VITE_WEB_BASE || "http://localhost:3000";

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "nod_auth_token",
  TOKEN_EXPIRES: "nod_token_expires",
  USER_INFO: "nod_user_info",
  RECENT_ARTICLES: "nod_recent_articles",
  SETTINGS: "nod_settings",
  PENDING_SYNC: "nod_pending_sync",
} as const;

// Content Extraction
export const MAX_CONTENT_LENGTH = 50000;
export const EXCERPT_LENGTH = 200;
export const WORDS_PER_MINUTE = 200;

// UI
export const POPUP_WIDTH = 360;
export const POPUP_MIN_HEIGHT = 200;
export const POPUP_MAX_HEIGHT = 500;
