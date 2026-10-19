-- Haber görselleri. R2 kredi kartı istediği için D1 içinde saklanıyor.
-- D1'de çıkış (egress) ücreti yoktur.
CREATE TABLE IF NOT EXISTS images (
  key        TEXT PRIMARY KEY,
  data       BLOB NOT NULL,
  type       TEXT NOT NULL DEFAULT 'image/jpeg',
  bytes      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_images_created ON images (created_at DESC);