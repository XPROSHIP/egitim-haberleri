#!/usr/bin/env python3
"""
ZENPOD Eğitim — günlük ses bülteni.

Günün haberlerinin hazır seslerini, açılış ve kapanış cümleleriyle
birleştirip tek bir MP3 bölüm haline getirir ve Worker'a yükler.

Açılış ve kapanış metni sıcak ve samimi: siteyi tanıtır, takip ve yorum
çağrısında bulunur.

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

API = os.environ.get("VITE_API_URL", "").rstrip("/")
SECRET = os.environ.get("COLLECT_SECRET", "")
SAMPLE_RATE = 24000
# Bölüm kısa ve öz olsun: en fazla 4 haber, toplam en fazla ~5,5 dakika.
# (Ses yükleme sınırı nedeniyle daha uzun bölümler tek dosyaya sığmıyor.)
MAX_ARTICLES = 4
MAX_SECONDS = 330

INTRO = (
    "Merhaba, ZENPOD Eğitim'e hoş geldiniz. Her gün eğitim gündeminden öne çıkan "
    "haberleri sizin için hazırlıyoruz. Mesleki eğitimden Milli Eğitim Bakanlığı'na, "
    "Çorum'dan yabancı eğitim gündemine kadar. Bütün haberler Eğitim Haberleri "
    "sitemizde yayımlanıyor; sitemizi takip edin, beğendiğiniz haberlere yorum yazarak "
    "bizi destekleyin. Şimdi günün haberlerine geçelim."
)

OUTRO = (
    "ZENPOD Eğitim'i dinlediğiniz için teşekkür ederiz. Bugünün haberleri Eğitim "
    "Haberleri sitesinde sizi bekliyor. Yeni bölümler için bizi takip edin, "
    "yorumlarınızı bırakmayı unutmayın. Görüşmek üzere."
)

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
        and it.get("hasAudio")
        and it.get("publishedAt")
        and (datetime.fromisoformat(it["publishedAt"].replace("Z", "+00:00")).timestamp() * 1000)
        >= cutoff
    ]
    todays.sort(key=lambda x: x.get("publishedAt") or "", reverse=True)
    todays = todays[:MAX_ARTICLES]

    if not todays:
        log("bugüne ait sesli haber yok, bölüm üretilmedi")
        return

    log(f"{len(todays)} haber seçildi")
    for it in todays:
        log(f"  · {it['title'][:70]}")

    from ema_lightning import EMA
    import numpy as np
    import soundfile as sf

    tts = EMA()

    def synth(text, cache_id):
        """Metni sese çevirir; aynı metin için önbellek kullanır."""
        cached = fetch_audio(cache_id)
        if cached:
            return cached, 0
        speech = tts.say(text, sample_rate=SAMPLE_RATE)
        pcm = np.asarray(speech.audio, dtype=np.float32)
        buf = io.BytesIO()
        sf.write(buf, pcm, SAMPLE_RATE, format="MP3")
        data_bytes = buf.getvalue()
        upload(cache_id, data_bytes, speech.duration)
        return data_bytes, speech.duration

    intro_bytes, intro_dur = synth(INTRO, "zenpod-intro")
    log(f"açılış hazır ({intro_dur:.0f} sn)")

    parts = [(intro_bytes, intro_dur)]
    total = intro_dur
    used = []
    for it in todays:
        audio = fetch_audio(it["id"])
        if not audio:
            continue
        dur = float(it.get("audioDuration") or 0)
        if total + dur > MAX_SECONDS:
            continue
        parts.append((audio, dur))
        total += dur
        used.append(it)
        if len(used) >= MAX_ARTICLES:
            break

    outro_bytes, outro_dur = synth(OUTRO, "zenpod-outro")
    parts.append((outro_bytes, outro_dur))
    total += outro_dur
    log(f"kapanış hazır ({outro_dur:.0f} sn)")

    episode = b"".join(p[0] for p in parts)
    log(f"bölüm: {len(used)} haber · {total:.0f} sn · {len(episode)/1024:.0f} KB")

    try:
        upload(episode_id, episode, total)
    except Exception as exc:  # noqa: BLE001
        # Bölüm yüklenemezse iş akışı durmasın; bir sonraki turda tekrar dener.
        log(f"bölüm yüklenemedi: {str(exc)[:120]}")
        return

    headlines = "\n".join(f"• {it['title']}" for it in used)
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
