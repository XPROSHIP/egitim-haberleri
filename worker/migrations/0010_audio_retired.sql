-- Sesler bir kez üretilir.
--
-- Ses tarifi (okuma kuralları, model, metin uzunluğu) değiştiğinde artık
-- mevcut sesler YENİDEN üretilmiyor: eski bir haberin sesi, o gün nasıl
-- okunduysa öyle kalır. Yalnızca sesi hiç olmayan haberler seslendirilir.
--
-- Depolama kotası dolduğunda en eski sesler siliniyor (kota bazlı saklama).
-- Silinen sesin yerine yenisinin üretilmemesi için haber "emekli" işaretlenir;
-- bu bayrak olmadan silme ile üretim birbirini sonsuz kovalar.
ALTER TABLE news ADD COLUMN audio_retired INTEGER NOT NULL DEFAULT 0;
