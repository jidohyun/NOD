CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX users_email_idx ON users(email);

CREATE TABLE oauth_states (
  state_hash TEXT PRIMARY KEY,
  browser_binding_hash TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('web', 'extension')),
  pkce_verifier TEXT NOT NULL,
  extension_redirect_uri TEXT,
  extension_state TEXT,
  extension_code_challenge TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK (
    (kind = 'web' AND extension_redirect_uri IS NULL AND extension_state IS NULL AND extension_code_challenge IS NULL)
    OR
    (kind = 'extension' AND extension_redirect_uri IS NOT NULL AND extension_state IS NOT NULL AND extension_code_challenge IS NOT NULL)
  )
);

CREATE INDEX oauth_states_expires_idx ON oauth_states(expires_at);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expires_idx ON sessions(expires_at);

CREATE TABLE extension_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX extension_tokens_user_idx ON extension_tokens(user_id);
CREATE INDEX extension_tokens_expires_idx ON extension_tokens(expires_at);

CREATE TABLE extension_auth_codes (
  code_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX extension_auth_codes_expires_idx ON extension_auth_codes(expires_at);

CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  hostname TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, url)
);

CREATE INDEX articles_user_created_idx ON articles(user_id, created_at DESC, id DESC);
CREATE INDEX articles_user_title_idx ON articles(user_id, title);
