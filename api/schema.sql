CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS storage_usage (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  used_bytes INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO storage_usage (id, used_bytes) VALUES (1, 0);

CREATE INDEX IF NOT EXISTS idx_videos_expiry ON videos(expires_at);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
