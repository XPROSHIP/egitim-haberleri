#!/usr/bin/env python3
"""
Haberleri EMA Lightning ile sese çevirip Worker'a yükler.

GitHub Actions'ta çalışır:
  pip install ema-lightning --extra-index-url https://download.pytorch.org/whl/cpu

Sesi olmayan yayınlanmış haberler işlenir; mevcut sesler atlanır.
Çıktı 24 kHz mono MP3'dir (~45 kbps), tam metin başına ~200-400 KB.
"""
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tts_text import clean_for_tts  # noqa: E402
from mp3 import encode_pcm  # noqa: E402

API = os.environ.get("VITE_API_URL", "").rstrip("/")
SECRET = os.environ.get("COLLECT_SECRET", "")
SAMPLE_RATE = 24000
# Uzun metinler de okunabilsin: eski sınır (2600) haberin gövdesini yarıda kesiyordu.
MAX_CHARS = 6000
# İş akışının zaman aşımına uğramaması için dakika cinsinden süre bütçesi.
BUDGET_MIN = float(os.environ.get("TTS_BUDGET_MIN", "38"))

if not API or not SECRET:
    print("VITE_API_URL / COLLECT_SECRET eksik", file=sys.stderr)
    sys.exit(1)


def log(msg):
    print(f"[tts] {msg}", flush=True)


def api_json(path):
    req = urllib.request.Request(
        f"{API}{path}", headers={"user-agent": "EgitimHaberleri-TTS/1.0"}
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode("utf-8"))


def upload(article_id, data: bytes, duration: float):
    url = f"{API}/api/audio?id={urllib.parse.quote(article_id)}"
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "content-type": "audio/mpeg",
            "x-collect-secret": SECRET,
            "x-audio-duration": str(round(duration, 2)),
            # Cloudflare 1010: Python'un varsayılan User-Agent'ı tarayıcı
            # bütünlük kontrolünde engelleniyor.
            "user-agent": "EgitimHaberleri-TTS/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as res:
        return res.status


def main():
    log("haberler cekiliyor")
    data = api_json("/api/news?limit=500")
    items = data.get("items", [])
    todo = [
        it
        for it in items
        if it.get("id")
        and not it.get("hasAudio")
        and len(it.get("body") or []) >= 1
    ]
    if not todo:
        log("sesi olmayan haber yok")
        return

    limit = int(os.environ.get("TTS_LIMIT", "0"))
    if limit:
        todo = todo[:limit]
        log(f"TEST: yalnizca {limit} haber islenecek")

    log(f"{len(todo)} haber seslendirilecek")
    from ema_lightning import EMA

    t0 = time.perf_counter()
    tts = EMA()
    log(f"model yuklendi ({time.perf_counter() - t0:.1f} sn)")

    import numpy as np
    import soundfile as sf

    ok = 0
    fail = 0
    deadline = time.time() + BUDGET_MIN * 60
    for i, it in enumerate(todo, 1):
        if time.time() > deadline:
            log(f"zaman butcesi doldu · {len(todo) - i + 1} haber sonraki kosuda")
            break
        body = " ".join(it.get("body") or [])
        # Noktalama temizlenir, kısaltmalar yazıyla okunur (MESEM -> Mesem).
        text = clean_for_tts(f"{it['title']}. {body}")
        if len(text) > MAX_CHARS:
            text = text[:MAX_CHARS]
        try:
            speech = tts.say(text, sample_rate=SAMPLE_RATE)
            pcm = np.asarray(speech.audio, dtype=np.float32)
            data_bytes = encode_pcm(pcm, SAMPLE_RATE)
            # Veritabanı satır sınırı ~6 MB. Sığmıyorsa metni kısaltıp yeniden üret.
            if len(data_bytes) > 6_000_000:
                shorter = text[: int(len(text) * 0.6)]
                speech = tts.say(shorter, sample_rate=SAMPLE_RATE)
                pcm = np.asarray(speech.audio, dtype=np.float32)
                data_bytes = encode_pcm(pcm, SAMPLE_RATE)
            upload(it["id"], data_bytes, speech.duration)
            ok += 1
            log(
                f"  [{i}/{len(todo)}] {speech.duration:5.1f} sn · {len(data_bytes) / 1024:5.0f} KB"
                f" · {it['title'][:48]}"
            )
        except Exception as exc:  # noqa: BLE001
            fail += 1
            log(f"  [{i}/{len(todo)}] HATA: {str(exc)[:90]}")

    log(f"tamam · {ok} ses · {fail} hata")
    kalan = len(todo) - ok - fail
    if kalan > 0:
        log(f"{kalan} haberin sesi sonraki kosuda uretilecek")


if __name__ == "__main__":
    main()
