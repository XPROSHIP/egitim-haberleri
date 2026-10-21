#!/usr/bin/env python3
"""
ZENPOD Eğitim — günlük ses bülteni.

Günün haberlerini ucuz modele (flash-lite) okutup SAMİMİ, enerjik bir
bülten metni yazdırır, sonra o metni EMA Lightning ile sese çevirip
Worker'a yükler. Düz haber metni okunmaz; editörün yazdığı bir metin
okunur.

Açılışta ve kapanışta site (Eğitim Haberleri) tanıtılır, okuyucudan takip
etme ve yorumla destekleme istenir.

GitHub Actions'ta çalışır (EMA Lightning kurulu olduğunda):
    python worker/scripts/podcast_generate.py
"""
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tts_text import clean_for_tts  # noqa: E402

API = os.environ.get("VITE_API_URL", "").rstrip("/")
SECRET = os.environ.get("COLLECT_SECRET", "")
KEYS = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", "").split(",") if k.strip()]
SAMPLE_RATE = 24000
# Bölüm kısa ve öz olsun (ses yükleme sınırı): en fazla ~7 dakika.
MAX_SECONDS = 420
MAX_WORDS = 950

if not API or not SECRET:
    print("VITE_API_URL / COLLECT_SECRET eksik", file=sys.stderr)
    sys.exit(1)


def log(msg):
    print(f"[podcast] {msg}", flush=True)


def api_json(path):
    req = urllib.request.Request(
        f"{API}{path}", headers={"user-agent": "EgitimHaberleri-Podcast/1.0"}
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode("utf-8"))


def api_post(path, payload):
    req = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "content-type": "application/json",
            "x-collect-secret": SECRET,
            "user-agent": "EgitimHaberleri-Podcast/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode("utf-8"))


def fetch_audio(article_id):
    url = f"{API}/api/audio/{urllib.parse.quote(article_id)}"
    req = urllib.request.Request(url, headers={"user-agent": "EgitimHaberleri-Podcast/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            return res.read()
    except Exception:
        return None


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
            "user-agent": "EgitimHaberleri-Podcast/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as res:
        return res.status


# ── Bülten metnini model yazsın ────────────────────────────────────────────

SCRIPT_SYSTEM = """Sen "ZENPOD Eğitim" sesli bülteninin yazarısın. Türkiye'nin eğitim
gündemini dinleyenlere, bugünün haberlerini sıcak ve enerjik bir dille anlatırsın.

KURALLAR:
- Metin 600 ile 900 kelime arasında olsun.
- YALNIZCA sana verilen başlık ve özetlere dayan. Uydurma bilgi, sayı, tarih veya kurum adı ekleme.
- En önemli haberden başla, sonra önem sırasına göre devam et. Her haber için 2 ila 4 cümle yaz:
  ne oldu, neden önemli, kimlerin ilgilenmesi gerekir.
- Haberler arasında doğal geçiş cümleleri kur: "Şimdi Milli Eğitim Bakanlığı'ndan bir duyuru",
  "Çorum'dan gelen bir başka haber", "Yabancı kaynaklardan gelen son gelişme" gibi.
- Aynı konudaki haberleri birleştir, tek tek tekrar etme.
- Kısaltmaları tek heceyle yaz: MESEM, MEB, YÖK, ALES, KPSS. Sayıları rakam olarak yaz.
- Hiçbir madde işareti, başlık işareti, bağlantı, hashtag veya noktalama kullanma. Düz, konuşma dilinde yaz.
- Başta dinleyenleri selamla ve bültenin konusunu bir cümleyle söyle.
- Sonda dinleyicilere şunu söyle: haberlerin tamamı Eğitim Haberleri sitesinde yayımlandı, siteyi takip etsinler
  ve yorumlarla destek versinler. Kapanış samimi olsun, acele etmeyen bir tonda bitsin.
- Yalnızca bülten metnini yaz; başka hiçbir şey yazma."""


def write_script(items):
    """Gemini'ye bülten metnini yazdırır. Başarısız olursa None."""
    if not KEYS:
        log("GEMINI_API_KEYS yok, bülten metni üretilemiyor")
        return None
    payload = "\n\n".join(
        f"{i + 1}. BAŞLIK: {it['title']}\n   ÖZET: {(it.get('excerpt') or '')[:300]}"
        for i, it in enumerate(items)
    )
    body = {
        "systemInstruction": {"parts": [{"text": SCRIPT_SYSTEM}]},
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            f"Bugünün eğitim haberleri ({len(items)} haber):\n\n{payload}\n\n"
                            "Bugünkü ZENPOD Eğitim bültenini yaz."
                        )
                    }
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096,
        },
    }
    for model in ("gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"):
        for key in KEYS:
            try:
                url = (
                    "https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{model}:generateContent?key={key}"
                )
                req = urllib.request.Request(
                    url,
                    data=json.dumps(body).encode("utf-8"),
                    method="POST",
                    headers={"content-type": "application/json"},
                )
                with urllib.request.urlopen(req, timeout=120) as res:
                    data = json.loads(res.read().decode("utf-8"))
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
                if text and len(text.split()) > 120:
                    log(f"bülten metni yazıldı ({model}, {len(text.split())} kelime)")
                    return text
            except Exception:
                continue
    return None


def main():
    if os.environ.get("PODCAST_DISABLED") == "1":
        log("kapalı (PODCAST_DISABLED=1)")
        return

    now = datetime.now(timezone.utc)
    day = now.strftime("%Y-%m-%d")
    episode_id = f"zenpod-{day}"

    # Aynı gün bölümü zaten varsa tekrar üretme.
    try:
        existing = api_json("/api/podcast/episodes").get("episodes", [])
        if any(e.get("id") == episode_id for e in existing):
            log(f"{episode_id} zaten var, atlanıyor")
            return
    except Exception:
        pass

    data = api_json("/api/news?limit=80")
    items = data.get("items", [])
    cutoff = (now - timedelta(hours=30)).timestamp() * 1000
    todays = [
        it
        for it in items
        if it.get("id")
        and it.get("title")
        and it.get("publishedAt")
        and (datetime.fromisoformat(it["publishedAt"].replace("Z", "+00:00")).timestamp() * 1000)
        >= cutoff
    ]
    todays.sort(key=lambda x: x.get("publishedAt") or "", reverse=True)
    todays = todays[:12]
    if not todays:
        log("bugüne ait haber yok, bölüm üretilmedi")
        return

    log(f"{len(todays)} haber bulundu")

    # 1) Bülten metnini model yazsın
    script = write_script(todays)
    if not script:
        log("bülten metni üretilemedi, atlanıyor")
        return

    # 2) Sese çevir (noktalama temizlenmiş hâli)
    from ema_lightning import EMA
    import numpy as np
    import soundfile as sf

    tts = EMA()
    spoken = clean_for_tts(script)
    words = spoken.split()
    if len(words) > MAX_WORDS:
        spoken = " ".join(words[:MAX_WORDS])
    log(f"seslendirilecek metin: {len(spoken.split())} kelime")

    try:
        speech = tts.say(spoken, sample_rate=SAMPLE_RATE)
    except Exception as exc:  # noqa: BLE001
        log(f"ses sentezi başarısız: {str(exc)[:120]}")
        return

    pcm = np.asarray(speech.audio, dtype=np.float32)
    buf = io.BytesIO()
    sf.write(buf, pcm, SAMPLE_RATE, format="MP3")
    episode = buf.getvalue()
    total = speech.duration
    log(f"bölüm hazır: {total:.0f} sn · {len(episode) / 1024:.0f} KB")

    if total > MAX_SECONDS * 1.4:
        log("bölüm çok uzun, atlanıyor")
        return

    try:
        upload(episode_id, episode, total)
    except Exception as exc:  # noqa: BLE001
        log(f"bölüm yüklenemedi: {str(exc)[:120]}")
        return

    headlines = "\n".join(f"• {it['title']}" for it in todays[:6])
    description = (
        f"ZENPOD Eğitim — {now.strftime('%d.%m.%Y')} günün eğitim haberleri.\n\n"
        f"{headlines}\n\n"
        "Bütün haberler Eğitim Haberleri sitesinde. Takip edin, yorumlarla destekleyin."
    )
    title = f"ZENPOD Eğitim · {now.strftime('%d.%m.%Y')} · Günün eğitim haberleri"
    try:
        api_post(
            "/api/podcast/episode",
            {
                "id": episode_id,
                "title": title,
                "description": description,
                "duration": total,
            },
        )
    except Exception as exc:  # noqa: BLE001
        log(f"bölüm kaydedilemedi: {str(exc)[:120]}")
        return
    log("bölüm kaydedildi")


if __name__ == "__main__":
    main()
