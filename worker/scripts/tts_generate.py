#!/usr/bin/env python3
"""
Haberleri EMA Lightning ile sese çevirip Worker'a yükler.

GitHub Actions'ta çalışır:
  pip install ema-lightning --extra-index-url https://download.pytorch.org/whl/cpu

Tek kural: yalnızca SESİ HİÇ OLMAYAN haberler seslendirilir. Okuma tarifi
(kurallar, model, metin uzunluğu) değişse bile mevcut sesler yeniden
üretilmez — eski haber, o gün nasıl okunduysa öyle kalır. Tarif sürümü
yalnızca kayıt/denetim için `news_audio.recipe` alanında tutulur. Depolama
kotası dolduğunda sesi silinen haberler `audio_retired` ile işaretlenir ve
bir daha seslendirilmez.

Her ses tek tek yüklenir: yeni dosya yüklenmeden eskisi durmaya devam eder,
ziyaretçi hiçbir ses kaybı yaşamaz. Ziyaretçiye hiçbir durum gösterilmez.

Çıktı 24 kHz mono MP3 (~32 kbps).
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
from tts_recipe import recipe_version, MAX_CHARS  # noqa: E402

API = os.environ.get("VITE_API_URL", "").rstrip("/")
SECRET = os.environ.get("COLLECT_SECRET", "")
SAMPLE_RATE = 24000
# İş akışının zaman aşımına uğramaması için dakika cinsinden süre bütçesi.
BUDGET_MIN = float(os.environ.get("TTS_BUDGET_MIN", "38"))


def log(msg):
    print(f"[tts] {msg}", flush=True)


def api_json(path):
    req = urllib.request.Request(
        f"{API}{path}", headers={"user-agent": "EgitimHaberleri-TTS/1.0"}
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode("utf-8"))


def upload(article_id, data: bytes, duration: float, recipe: str | None):
    """Sesi yükler. Worker ara sıra 503 dönebiliyor; kısa bekleyip yeniden dener."""
    url = f"{API}/api/audio?id={urllib.parse.quote(article_id)}"
    headers = {
        "content-type": "audio/mpeg",
        "x-collect-secret": SECRET,
        "x-audio-duration": str(round(duration, 2)),
        # Cloudflare 1010: Python'un varsayılan User-Agent'ı tarayıcı
        # bütünlük kontrolünde engelleniyor.
        "user-agent": "EgitimHaberleri-TTS/1.0",
    }
    if recipe:
        headers["x-audio-recipe"] = recipe
    last = None
    for attempt in range(4):
        req = urllib.request.Request(url, data=data, method="POST", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=180) as res:
                return res.status
        except Exception as exc:  # noqa: BLE001
            last = exc
            status = getattr(exc, "code", None)
            # 4xx kalıcı hatalar (417/413 gibi) tekrar denemeye değmez.
            if status and status < 500 and status != 429:
                raise
            time.sleep(4 * (attempt + 1))
    raise last


def select_queue(items, _recipe=None):
    """
    İş sırasını kurar.

    Yalnızca **sesi hiç olmayan** haberler seslendirilir.

    Okuma kuralları, model ya da metin hazırlama değiştiğinde mevcut sesler
    yeniden üretilmez: eski haber, o gün nasıl okunduysa öyle kalır. Tarif
    sürümü (`recipe`) yalnızca kayıt/denetim amaçlı tutulur.

    `audioRetired` işaretli haberlerin sesi depolama kotası için bilerek
    silinmiştir; bir daha seslendirilmez (silme ile üretim sonsuz döngüye
    girmesin).
    """
    fresh = [
        it
        for it in items
        if it.get("id")
        and not it.get("hasAudio")
        and not it.get("audioRetired")
        and (it.get("body") or [])
    ]
    return fresh, []


def main():
    if not API or not SECRET:
        print("VITE_API_URL / COLLECT_SECRET eksik", file=sys.stderr)
        sys.exit(1)
    recipe = recipe_version()
    log(f"okuma tarifi: {recipe}")

    data = api_json("/api/news?limit=500&include_body=1")
    items = data.get("items", [])
    fresh, _ = select_queue(items, recipe)
    log(f"sesi olmayan: {len(fresh)} · mevcut sesler korunuyor (yeniden üretim yok)")

    limit = int(os.environ.get("TTS_LIMIT", "0"))
    if limit:
        fresh = fresh[:limit]
        log(f"TEST: yalnizca {limit} haber islenecek")

    todo = fresh
    if not todo:
        log("seslendirilecek yeni haber yok")
        _report(recipe, 0, 0, 0, 0)
        return

    log(f"{len(todo)} haber seslendirilecek")
    from ema_lightning import EMA

    t0 = time.perf_counter()
    tts = EMA()
    log(f"model yuklendi ({time.perf_counter() - t0:.1f} sn)")

    import numpy as np

    ok = 0
    fail = 0
    done = 0
    start = time.time()
    deadline = start + BUDGET_MIN * 60
    for i, it in enumerate(todo, 1):
        if time.time() > deadline:
            log(f"zaman butcesi doldu · {len(todo) - i + 1} haber sonraki kosuya kaldi")
            break
        body = " ".join(it.get("body") or [])
        # Noktalama korunur (duraklama için); yalnızca modelin sesli okuduğu
        # işaretler temizlenir ve kısaltmalar açılımlarıyla değiştirilir.
        text = clean_for_tts(f"{it['title']}. {body}")
        if len(text) > MAX_CHARS:
            text = text[:MAX_CHARS]
            # Cümle ortasında kesme: son nokta/virgül sınırına kadar al.
            cut = max(text.rfind(". "), text.rfind("! "), text.rfind("? "))
            if cut > MAX_CHARS * 0.5:
                text = text[: cut + 1]
        try:
            speech = tts.say(text, sample_rate=SAMPLE_RATE)
            pcm = np.asarray(speech.audio, dtype=np.float32)
            data_bytes = encode_pcm(pcm, SAMPLE_RATE, bitrate="32k")
            # Veritabanı satır sınırı ~6 MB. Sığmıyorsa metni kısaltıp yeniden üret.
            for _ in range(3):
                if len(data_bytes) <= 6_000_000:
                    break
                text = text[: int(len(text) * 0.6)]
                speech = tts.say(text, sample_rate=SAMPLE_RATE)
                pcm = np.asarray(speech.audio, dtype=np.float32)
                data_bytes = encode_pcm(pcm, SAMPLE_RATE, bitrate="32k")
            if len(data_bytes) > 6_200_000:
                log(f"  ses çok büyük, atlandı: {len(data_bytes) / 1048576:.1f} MB")
                continue
            upload(it["id"], data_bytes, speech.duration, recipe)
            ok += 1
            done += 1
            log(
                f"  [{i}/{len(todo)}] {speech.duration:5.1f} sn · {len(data_bytes) / 1024:5.0f} KB"
                f" · {it['title'][:48]}"
            )
        except Exception as exc:  # noqa: BLE001
            fail += 1
            log(f"  [{i}/{len(todo)}] HATA: {str(exc)[:90]}")

    elapsed = max(0.001, time.time() - start)
    rate = done / elapsed * 60 if done else 0
    log(f"tamam · {ok} ses · {fail} hata · {rate:.1f} haber/dk")
    kalan = len(todo) - ok - fail
    if kalan > 0:
        # Bir koşunun kapasitesi: süre bütçesi × dakikada üretilen haber.
        kapasite = max(1.0, BUDGET_MIN * rate)
        kosu = kalan / kapasite
        log(
            f"{kalan} haber kaldi · bir koşuda ~{kapasite:.0f} haber → ~{kosu:.1f} koşu daha"
            f" (bos gecen ~{kosu * 3:.1f} saat)"
        )
    _report(recipe, ok, fail, rate, kalan)


def _report(recipe, ok, fail, rate, remaining):
    """Durumu system_state'e yazar: operatör için, ziyaretçi arayüzüne dokunmadan."""
    payload = {
        "ok": True,
        "recipe": recipe,
        "produced": ok,
        "failed": fail,
        "perMinute": round(rate, 2),
        "remaining": remaining,
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    try:
        req = urllib.request.Request(
            f"{API}/api/state/audio",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "content-type": "application/json",
                "x-collect-secret": SECRET,
                "user-agent": "EgitimHaberleri-TTS/1.0",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as res:
            res.read()
    except Exception as exc:  # noqa: BLE001
        log(f"durum yazilamadi: {str(exc)[:80]}")


if __name__ == "__main__":
    main()
