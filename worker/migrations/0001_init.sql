-- Eğitim Haberleri · Cloudflare D1 şeması
-- Uygulama:  npx wrangler d1 migrations apply egitim-haberleri --remote

CREATE TABLE IF NOT EXISTS news (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  excerpt      TEXT NOT NULL DEFAULT '',
  body         TEXT NOT NULL DEFAULT '[]',
  category     TEXT NOT NULL DEFAULT 'gundem',
  tags         TEXT NOT NULL DEFAULT '[]',
  source_name  TEXT NOT NULL DEFAULT '',
  source_url   TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL,
  views        INTEGER NOT NULL DEFAULT 0,
  likes        INTEGER NOT NULL DEFAULT 0,
  featured     INTEGER NOT NULL DEFAULT 0,
  ai_compiled  INTEGER NOT NULL DEFAULT 1,
  province     TEXT,
  score        REAL NOT NULL DEFAULT 0,
  dedupe_key   TEXT UNIQUE,
  status       TEXT NOT NULL DEFAULT 'published',
  raw_title    TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_news_published  ON news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category   ON news (category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_status     ON news (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_province   ON news (province);

CREATE TABLE IF NOT EXISTS collector_runs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger    TEXT NOT NULL,
  started_at TEXT NOT NULL,
  duration_ms INTEGER,
  fetched    INTEGER NOT NULL DEFAULT 0,
  inserted   INTEGER NOT NULL DEFAULT 0,
  published  INTEGER NOT NULL DEFAULT 0,
  errors     TEXT NOT NULL DEFAULT '[]'
);
