#!/usr/bin/env python3
"""
Haberleri EMA Lightning ile sese çevirip Worker'a yükler.

GitHub Actions'ta çalışır:
  pip install ema-lightning --extra-index-url https://download.pytorch.org/whl/cpu

İki kuyruk, bu sırayla:
  1) SESİ OLMAYAN haberler  → yeni yayımlanan haberler her zaman önce,
     yeniden üretim kuyruğunun arkasında kalmaz.
  2) BAYAT sesler            → okuma tarifi sürümü eski kalan sesler.
     Tarift sürümü içerikten otomatik türetilir (tts_recipe.py): okuma
     kuralları, model veya okunan metin uzunluğu değiştiyse eski sesler
     yeniden üretilir. Yalnızca bit hızı/örnekleme hızı gibi kodlama
     değişiklikleri taramı değiştirmez, sadece yeni dosyalara uygulanır.

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
    req = urllib.request.Request(url, data=data, method="POST", headers=headers)
    with urllib.request.urlopen(req, timeout=180) as res:
        return res.status


def select_queue(items, recipe):
    """
    İş sırasını kurar.

    1) Sesi hiç olmayan haberler (yeni yayınlar) — her zaman önce.
    2) Okuma tarifi bayat kalan sesler — sırasıyla.
    """
    fresh = [it for it in items if it.get("id") and not it.get("hasAudio") and (it.get("body") or [])]
    stale = [
        it
        for it in items
        if it.get("id")
        and it.get("hasAudio")
        and it.get("audioRecipe")
        and it.get("audioRecipe") != recipe
        and (it.get("body") or [])
    ]
    # Tarifi hiç kaydedilmemiş sesler (eski üretimler) de bayattır.
    unknown = [
        it
        for it in items
        if it.get("id")
        and it.get("hasAudio")
        and not it.get("audioRecipe")
        and (it.get("body") or [])
    ]
    return fresh, stale + unknown


def main():
    if not API or not SECRET:
        print("VITE_API_URL / COLLECT_SECRET eksik", file=sys.stderr)
        sys.exit(1)
    recipe = recipe_version()
    log(f"okuma tarifi: {recipe}")

    data = api_json("/api/news?limit=500")
    items = data.get("items", [])
    fresh, stale = select_queue(items, recipe)
    log(f"sesi olmayan: {len(fresh)} · bayat (yenilenecek): {len(stale)}")

    limit = int(os.environ.get("TTS_LIMIT", "0"))
    if limit:
        stale = stale[:limit]
        log(f"TEST: yalnizca {limit} bayat haber islenecek")

    todo = fresh + stale
    if not todo:
        log("sesi olmayan ya da bayat haber yok")
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
        kosu = kalan / rate if rate else 0
        log(f"{kalan} haber kaldi · ~{kosu:.1f} kosu daha (bos gecen ~{kosu * 3 / 60:.1f} saat)")
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
