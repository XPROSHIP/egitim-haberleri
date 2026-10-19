-- Haber sesleri (EMA Lightning ile üretilen MP3).
ALTER TABLE news ADD COLUMN audio_id TEXT;
ALTER TABLE news ADD COLUMN audio_duration REAL;

CREATE TABLE IF NOT EXISTS news_audio (
  article_id TEXT PRIMARY KEY,
  data       BLOB NOT NULL,
  type       TEXT NOT NULL DEFAULT 'audio/mpeg',
  duration   REAL,
  bytes      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);