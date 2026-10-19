#!/usr/bin/env python3
"""
Haberleri EMA Lightning ile sese çevirip Worker'a yükler.

GitHub Actions'ta çalışır: pip install ema-lightning --extra-index-url
https://download.pytorch.org/whl/cpu

Yalnızca henüz sesi olmayan haberler işlenir; mevcut sesler atlanır.
Çıktı 24 kHz mono MP3'dir (~45 kbps), haber başına ~375 KB.
"""
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API = os.environ.get("VITE_API_URL", "").rstrip("/")
SECRET = os.environ.get("COLLECT_SECRET", "")
ROOT = Path(__file__).resolve().parents[2]  # scripts/ -> worker/ -> proje kökü
DATA = ROOT / "src" / "data" / "collected.json"
SAMPLE_RATE = 24000

if not API or not SECRET:
    print("VITE_API_URL / COLLECT_SECRET eksik", file=sys.stderr)
    sys.exit(1)


def log(msg):
    print(f"[tts] {msg}", flush=True)


def get_existing_ids():
    """Hangi haberlerin sesi var? (D1'den okumak yerine Worker ucundan)"""
    ids = set()
    items = json.loads(DATA.read_text(encoding="utf-8"))
    for it in items:
        if it.get("audioId"):
            ids.add(it["id"])
    return ids


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
    with urllib.request.urlopen(req, timeout=120) as res:
        return res.status


def main():
    items = json.loads(DATA.read_text(encoding="utf-8"))
    have = get_existing_ids()
    todo = [
        it
        for it in items
        if it.get("id")
        and it["id"] not in have
        and it.get("status") == "published"
        and len((it.get("body") or [])) >= 2
    ]
    if not todo:
        log("sesi olmayan haber yok")
        return

    log(f"{len(todo)} haber seslendirilecek")
    limit = int(os.environ.get("TTS_LIMIT", "0"))
    if limit:
        todo = todo[:limit]
        log(f"TEST: yalnizca {limit} haber işlenecek")
    from ema_lightning import EMA

    t0 = time.perf_counter()
    tts = EMA()
    log(f"model yuklendi ({time.perf_counter() - t0:.1f} sn)")

    import numpy as np
    import soundfile as sf

    ok = 0
    fail = 0
    for i, it in enumerate(todo, 1):
        body = " ".join(it.get("body") or [])
        text = f"{it['title']}. {body}"
        if len(text) > 2500:
            text = text[:2500]
        try:
            speech = tts.say(text, sample_rate=SAMPLE_RATE)
            pcm = np.asarray(speech.audio, dtype=np.float32)
            buf = io.BytesIO()
            sf.write(buf, pcm, SAMPLE_RATE, format="MP3")
            data = buf.getvalue()
            upload(it["id"], data, speech.duration)
            it["audioId"] = it["id"]
            it["audioDuration"] = round(speech.duration, 2)
            ok += 1
            log(f"  [{i}/{len(todo)}] {speech.duration:5.1f} sn · {len(data) / 1024:5.0f} KB · {it['title'][:52]}")
        except Exception as exc:  # noqa: BLE001
            fail += 1
            log(f"  [{i}/{len(todo)}] HATA: {str(exc)[:90]}")

    DATA.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"tamam · {ok} ses · {fail} hata")


if __name__ == "__main__":
    import urllib.parse  # noqa: E402  (upload icin gerekli)

    main()
