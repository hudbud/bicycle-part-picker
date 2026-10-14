-- Email sign-in links. An account can now start from an email address instead of Google:
-- those have google_sub = 'email:<address>' (like 'dev:<address>' for local test accounts)
-- until the same person signs in with Google, which links the two.

-- The address this person has proven they own, lowercased: by clicking an emailed link, or
-- through Google with email_verified. One account per address.
ALTER TABLE users ADD COLUMN verified_email TEXT;
CREATE UNIQUE INDEX users_verified_email ON users(verified_email);

-- Each emailed link + code. Kept for a day after sending (rate limits count them), then removed.
CREATE TABLE email_codes (
  token_hash TEXT PRIMARY KEY,    -- SHA-256 of the link's token
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,        -- SHA-256 of token_hash + the 6-digit code
  attempts INTEGER NOT NULL DEFAULT 0,
  ip TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX email_codes_email ON email_codes(email, created_at);
CREATE INDEX email_codes_ip ON email_codes(ip, created_at);
CREATE INDEX email_codes_created ON email_codes(created_at);
