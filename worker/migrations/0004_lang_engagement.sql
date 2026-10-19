-- Yabancı kaynaklardan çevrilen haberler için kaynak dil.
ALTER TABLE news ADD COLUMN lang TEXT NOT NULL DEFAULT 'tr';
ALTER TABLE news ADD COLUMN comments_count INTEGER NOT NULL DEFAULT 0;

-- Beğeni, kaydetme ve yorumlar: gerçek kullanıcı verisi.
CREATE TABLE IF NOT EXISTS news_likes (
  article_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (article_id, user_id)
);

CREATE TABLE IF NOT EXISTS news_bookmarks (
  article_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (article_id, user_id)
);

CREATE TABLE IF NOT EXISTS news_comments (
  id         TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL,
  parent_id  TEXT,
  likes      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON news_comments (article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user ON news_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON news_bookmarks (user_id);