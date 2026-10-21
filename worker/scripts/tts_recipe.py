"""
Okuma tarifinin (reading recipe) sürümü.

Kural: Yalnızca OKUMAYI etkileyen girdiler sürüme girer. Metnin nasıl
okunduğunu değiştiren her şey (hazırlık kuralları, model, okunan metin
uzunluğu) sürümü değiştirir ve eski sesler "bayat" olur. Yalnızca dosya
biçimini/ boyutunu etkileyen ayarlar (bit hızı, örnekleme hızı, encoder)
SÜRÜME GİRMEZ — bunlar sadece yeni üretilen dosyalara uygulanır.

Sürüm numarası elle artırılmaz; içerikten türetilir. Böylece bir kural
değişikliği fark edilmeden geçmez.
"""

import hashlib
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent

# TTS modeli: değişirse ses değişir → sürüme girer.
MODEL_NAME = "ema-lightning"

# Okunan metin uzunluğu sınırı: değişirse ne okunduğu değişir → sürüme girer.
# (tts_generate.py ile aynı değer olmalı; burada tek kaynak olarak tutulur.)
MAX_CHARS = 6000

# Sürüme GİRMEYEN ayarlar (bilinçli olarak dışarıda):
#   - bit hızı / örnekleme hızı / encoder ayarları (yalnızca dosya boyutu)
BITRATE = "32k"
SAMPLE_RATE = 24000


def _file_digest(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError:
        return "yok"


def _package_version() -> str:
    try:
        from importlib.metadata import version

        return version(MODEL_NAME)
    except Exception:
        return "bilinmiyor"


def recipe_version() -> str:
    """Okuma tarifinin sürümü: 'tts-<10 hex>'. Elle artırılmaz, içerikten türetilir."""
    parts = [
        _file_digest(HERE / "tts_text.py"),  # okuma kuralları
        MODEL_NAME,
        _package_version(),                  # model sürümü
        str(MAX_CHARS),                      # okunan metin uzunluğu
    ]
    digest = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()[:10]
    return f"tts-{digest}"


if __name__ == "__main__":
    print(recipe_version())
