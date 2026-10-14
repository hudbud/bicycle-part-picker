-- Hosted bike photos. The image bytes live in R2 (binding PHOTOS) under `p/<id>`; this table
-- says whose each one is, so quotas, clean-up and account deletion don't need to list R2.
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bytes INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  -- When clean-up first found no bike using it. Deleted a week later if still unused, so undo
  -- and devices that were offline for a few days don't lose photos.
  orphaned_at INTEGER
);
CREATE INDEX photos_user ON photos(user_id);
