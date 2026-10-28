-- Haber görselleri — AYRI D1 veritabanı.
--
-- Ses ile aynı gerekçe: medya ana veritabanını doldurduğunda haber toplama
-- durmasın. Görsel kotası dolunca en eski görseller silinir, haber metni
-- (ana veritabanında) kalıcı kalır; arayüz o haberlerde kategori rengine
-- dayalı yedeği gösterir.
CREATE TABLE IF NOT EXISTS images (
  key        TEXT PRIMARY KEY,
  data       BLOB NOT NULL,
  type       TEXT NOT NULL DEFAULT 'image/jpeg',
  bytes      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_images_created ON images (created_at ASC);
