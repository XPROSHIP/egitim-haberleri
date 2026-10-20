-- Yorum beğenileri: gerçek kullanıcı verisi.
CREATE TABLE IF NOT EXISTS news_comment_likes (
  comment_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON news_comment_likes (user_id);

-- Asistan kullanım kotası (kullanıcı başına günlük soru hakkı).
CREATE TABLE IF NOT EXISTS assistant_usage (
  user_id TEXT NOT NULL,
  day     TEXT NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- Asistan sohbet geçmişi: panel yeniden açıldığında mesajlar korunur.
CREATE TABLE IF NOT EXISTS assistant_messages (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  role       TEXT NOT NULL,
  text       TEXT NOT NULL,
  sources    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assistant_messages_user ON assistant_messages (user_id, created_at);
