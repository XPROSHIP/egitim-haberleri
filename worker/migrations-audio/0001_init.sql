-- Haber sesleri — AYRI D1 veritabanı.
--
-- D1'in ücretsiz kademesinde tek veritabanı 500 MB, hesap toplamı 5 GB.
-- Ses dosyaları ana veritabanında tutulduğunda 500 MB'lık tavan yüzünden
-- haber toplama tamamen duruyordu (bkz. Ekim 2026 kesintisi). Bu yüzden
-- medya ayrı veritabanlarında: kota dolunca yalnızca en eski ses silinir,
-- haber metni ana veritabanında kalıcı kalır.
CREATE TABLE IF NOT EXISTS news_audio (
  article_id TEXT PRIMARY KEY,
  data       BLOB NOT NULL,
  type       TEXT NOT NULL DEFAULT 'audio/mpeg',
  duration   REAL,
  bytes      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  recipe     TEXT
);

-- Silme sırası "en eski önce" olduğu için created_at indeksli.
CREATE INDEX IF NOT EXISTS idx_audio_created ON news_audio (created_at ASC);
