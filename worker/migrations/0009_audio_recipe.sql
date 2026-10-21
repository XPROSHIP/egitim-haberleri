-- Ses kaydının üretildiği "okuma tarifi" sürümü.
-- Okuma kuralları, model veya okunan metin uzunluğu değişirse sürüm değişir
-- ve o sesler yeniden üretilir. Yalnızca kodlama ayarları (bit hızı,
-- örnekleme hızı) sürümü etkilemez.
ALTER TABLE news_audio ADD COLUMN recipe TEXT;
ALTER TABLE news ADD COLUMN audio_recipe TEXT;
