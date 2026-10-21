-- Analitik: çerezsiz, kişi belirlemeyen sayfa görüntülenme sayacı.
-- Kimlik tutulmaz; yalnızca yol + gün + sayaç tutulur.
CREATE TABLE IF NOT EXISTS page_views (
  day   TEXT NOT NULL,
  path  TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

-- Web push aboneleri (VAPID).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  categories TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions (user_id);

-- Kullanıcı ilgi alanları: "Sana Özel" akışı bununla sıralanır.
CREATE TABLE IF NOT EXISTS user_interests (
  user_id  TEXT NOT NULL,
  kind     TEXT NOT NULL,
  value    TEXT NOT NULL,
  weight   REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, kind, value)
);

-- ZENPOD bölümleri (günlük ses bülteni).
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  audio_id    TEXT NOT NULL,
  duration    REAL,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);
