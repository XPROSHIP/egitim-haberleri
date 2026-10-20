-- Sistemin kendi durumu: tetikleme başarısı, son toplama zamanı.
-- Böylece token bozulursa hatırlamak yerine site uyarır.
CREATE TABLE IF NOT EXISTS system_state (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);