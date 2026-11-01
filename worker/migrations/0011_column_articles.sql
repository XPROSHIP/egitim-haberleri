-- Köşe Yazıları Şeması
CREATE TABLE IF NOT EXISTS column_articles (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  author_name   TEXT NOT NULL,
  author_image  TEXT,
  author_title  TEXT,
  source_name   TEXT NOT NULL,
  source_url    TEXT NOT NULL,
  excerpt       TEXT NOT NULL DEFAULT '',
  body          TEXT NOT NULL DEFAULT '[]',
  published_at  TEXT NOT NULL,
  views         INTEGER NOT NULL DEFAULT 0,
  likes         INTEGER NOT NULL DEFAULT 0,
  lang          TEXT NOT NULL DEFAULT 'tr',
  original_lang TEXT,
  translated    INTEGER NOT NULL DEFAULT 0,
  tags          TEXT NOT NULL DEFAULT '[]',
  dedupe_key    TEXT UNIQUE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_col_published ON column_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_col_author    ON column_articles (author_name, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_col_source    ON column_articles (source_name);