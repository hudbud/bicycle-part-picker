-- Accounts: who's signed in, and each person's saved data (one JSON blob per store).
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  picture TEXT,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

-- Only a SHA-256 of the cookie token is stored, so the table can't be used to sign in.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

-- `version` goes up on every write; a save based on an older version is refused (409).
CREATE TABLE user_data (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  data TEXT NOT NULL,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, key)
);
