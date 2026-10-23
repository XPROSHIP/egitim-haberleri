#!/usr/bin/env python3
"""
Okuma tarifi politikasının denetimi.

Kanıtlar:
  1) Bit hızı / örnekleme hızı değişimi tarif sürümünü DEĞİŞTİRMEZ.
  2) Metin hazırlama kuralları, model veya okunan metin uzunluğu değişimi
     tarif sürümünü DEĞİŞTİRİR.
  3) Kuyruk: yalnızca sesi hiç olmayan haberler. Ses tarifi değişse bile
     mevcut sesler YENİDEN ÜRETİLMEZ; kotası dolduğu için silinmiş
     (`audioRetired`) haberler de bir daha seslendirilmez.
  4) Sürüm elle değiştirilemez: içerikten türetilir.

Çalıştırma:  python worker/scripts/test_recipe.py
"""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import tts_recipe  # noqa: E402
import tts_generate  # noqa: E402

ok = True


def kontrol(ad, kosul):
    global ok
    print(("  GECTI  " if kosul else "  KALDI  ") + ad)
    if not kosul:
        ok = False


def sifirla():
    tts_recipe._file_digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


def surum(bitrate=None, max_chars=None, kural=None):
    """Verilen değişikliklerle tarif sürümünü hesaplar (dosyaya dokunmadan)."""
    onceki_bitrate = tts_recipe.BITRATE
    onceki_max = tts_recipe.MAX_CHARS
    onceki_digest = tts_recipe._file_digest
    try:
        if bitrate is not None:
            tts_recipe.BITRATE = bitrate
        if max_chars is not None:
            tts_recipe.MAX_CHARS = max_chars
        if kural is not None:
            tts_recipe._file_digest = lambda path: kural
        return tts_recipe.recipe_version()
    finally:
        tts_recipe.BITRATE = onceki_bitrate
        tts_recipe.MAX_CHARS = onceki_max
        tts_recipe._file_digest = onceki_digest


print("1) Kodlama ayarlari tarami degistirmez")
temel = surum()
kontrol("bit hizi 32k -> 24k ayni surum", surum(bitrate="24k") == temel)
kontrol("bit hizi 32k -> 48k ayni surum", surum(bitrate="48k") == temel)

print("2) Okumayi etkileyen girdiler tarami degistirir")
kontrol("okunan metin uzunlugu 6000 -> 5000 farkli surum", surum(max_chars=5000) != temel)
kontrol(
    "metin hazirlama kurallari degisince farkli surum",
    surum(kural="farkli-kural-hashi") != temel,
)

print("3) Kuyruk: yalnizca sesi olmayanlar, mevcut sesler korunur")
r = surum()
ornek = [
    {"id": "1", "hasAudio": False, "body": ["x"], "title": "yeni"},
    {"id": "2", "hasAudio": True, "audioRecipe": r, "body": ["x"], "title": "guncel"},
    {"id": "3", "hasAudio": True, "audioRecipe": "tts-eski", "body": ["x"], "title": "bayat"},
    {"id": "4", "hasAudio": True, "audioRecipe": None, "body": ["x"], "title": "tarifsiz"},
    {
        "id": "5",
        "hasAudio": False,
        "audioRetired": True,
        "body": ["x"],
        "title": "emekli",
    },
    {"id": "6", "hasAudio": False, "body": [], "title": "govdesiz"},
]
yeni, yenilenecek = tts_generate.select_queue(ornek, r)
kontrol("yalnizca sesi olmayan haber kuyrukta", [i["title"] for i in yeni] == ["yeni"])
kontrol("tarif degisse de eski sesler yenilenmiyor", yenilenecek == [])
kontrol("kotadan silinen ses bir daha uretilmiyor", "emekli" not in [i["title"] for i in yeni])
kontrol("govdesiz haber seslendirilmiyor", "govdesiz" not in [i["title"] for i in yeni])


print("4) Surum elle degistirilemez (icerikten turetilir)")
kontrol("surum icerikten turetiliyor", surum().startswith("tts-") and len(surum()) == 14)
kontrol("iki ardisik hesap ayni", surum() == surum())

print()
print("SONUC:", "GECTI" if ok else "KALDI")
sys.exit(0 if ok else 1)
