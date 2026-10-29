#!/usr/bin/env python3
"""
Yabancı (İngilizce) haberlerin Türkçe çevirisini yeniden üretir.

Eski akış modele yalnızca ilk 900 karakteri gönderiyordu; çeviriler
kaynak metnin %3-26'sı olarak yayımlanıyordu. Burada kaynak metnin TAMAMI
gönderilir ve her paragraf birebir karşılık gelir.

Kullanım:  python worker/scripts/retranslate_foreign.py [--limit=50]
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

API = os.environ.get("VITE_API_URL", "").rstrip("/")
SECRET = os.environ.get("COLLECT_SECRET", "")
KEYS = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", "").split(",") if k.strip()]

if not API or not SECRET:
    print("VITE_API_URL / COLLECT_SECRET eksik", file=sys.stderr)
    sys.exit(1)

SYSTEM = """Sen Türkiye eğitim basınının editörüsün. Sana İngilizce eğitim haberleri verilir.
GÖREV: Haberleri TAM olarak Türkçeye çevir ve editle.
- Kaynak metindeki HER paragrafı çevir. Girdide kaç numaralı paragraf varsa, çıktıda da
  o kadar paragraf olsun ve SIRAYI KORU. Metni kısaltma, özetleme, atlama: bir paragrafın
  uzunluğu kaynağına yakın olmalı.
- Başlığı doğal Türkçe haber diliyle yaz (8-14 kelime). Cümle başı büyük harfle başlar.
- Özet: tek paragraf, en fazla 2 cümle, Türkçe; kaynağın özünü yansıtır.
- Etiketler: 2-4 adet, Türkçe, büyük harf.
- Kurum adlarını çevirme: "University of Oxford" -> "Oxford Üniversitesi".
- Sayı, tarih, yer adı ve alıntıları BİREBİR koru.
JSON dizisi döndür; id alanı girdi numarasıyla aynı olmalı."""

SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id": {"type": "integer"},
            "title": {"type": "string"},
            "excerpt": {"type": "string"},
            "paragraphs": {"type": "array", "items": {"type": "string"}},
            "tags": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["id", "title", "excerpt", "paragraphs", "tags"],
    },
}

MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"]


def log(msg):
    print(f"[ceviri] {msg}", flush=True)


def api_json(path):
    req = urllib.request.Request(
        f"{API}{path}", headers={"user-agent": "EgitimHaberleri-Ceviri/1.0"}
    )
    with urllib.request.urlopen(req, timeout=90) as res:
        return json.loads(res.read().decode("utf-8"))


def api_post(path, payload):
    req = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "content-type": "application/json",
            "x-collect-secret": SECRET,
            "user-agent": "EgitimHaberleri-Ceviri/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=90) as res:
        return json.loads(res.read().decode("utf-8"))


def call_gemini(prompt):
    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 32768,
            "responseMimeType": "application/json",
            "responseSchema": SCHEMA,
        },
    }
    last = None
    for model in MODELS:
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
                with urllib.request.urlopen(req, timeout=300) as res:
                    data = json.loads(res.read().decode("utf-8"))
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
                if text:
                    return json.loads(text)
            except Exception as exc:  # noqa: BLE001
                last = exc
                time.sleep(2)
    raise last or RuntimeError("ceviri basarisiz")


def fetch_paragraphs(url):
    """Kaynak sayfadaki İngilizce paragraf metnini çeker."""
    try:
        from urllib.request import Request, urlopen

        ua = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        )
        req = Request(url, headers={"user-agent": ua, "accept": "text/html"})
        with urlopen(req, timeout=30) as res:
            raw = res.read()
            ctype = res.headers.get("content-type", "")
        m = re.search(r"charset=([\w-]+)", ctype, re.I)
        label = m.group(1) if m else "utf-8"
        try:
            html = raw.decode(label, "replace")
        except LookupError:
            html = raw.decode("utf-8", "replace")
        html = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", html, flags=re.I)
        paras = []
        for m in re.finditer(r"<p\b[^>]*>([\s\S]{80,6000}?)</p>", html, re.I):
            t = re.sub(r"<[^>]+>", " ", m.group(1))
            t = re.sub(r"&nbsp;", " ", t)
            t = re.sub(r"&[a-z#0-9]+;", " ", t)
            t = re.sub(r"\s+", " ", t).strip()
            if len(t) > 120 and t.count(" ") > 18:
                paras.append(t)
        return paras
    except Exception:
        return []


def main():
    limit = 50
    for arg in sys.argv[1:]:
        if arg.startswith("--limit="):
            limit = int(arg.split("=")[1])

    if not KEYS:
        log("GEMINI_API_KEYS yok")
        return

    data = api_json("/api/news?limit=500&include_body=1")
    items = [i for i in data.get("items", []) if i.get("lang") == "en"]
    log(f"{len(items)} yabancı haber, ilk {limit} işlenecek")

    atlandi = 0
    for i, it in enumerate(items[:limit], 1):
        paras = fetch_paragraphs(it["source"]["url"])
        if len(paras) < 2:
            log(f"  [{i}/{limit}] kaynak metin alınamadı: {it['title'][:40]}")
            continue
        src_chars = sum(len(p) for p in paras)
        # Zaten tam çevrilmişse atla (tekrar çevirmek zaman kaybı).
        mevcut = sum(len(p) for p in (it.get("body") or []))
        if src_chars > 500 and mevcut >= src_chars * 0.6:
            atlandi += 1
            continue
        numbered = "\n".join(f"[{k + 1}] {p}" for k, p in enumerate(paras))
        prompt = (
            f"1. TITLE: {it.get('rawTitle') or it['title']}\n"
            f"   BODY:\n{numbered}\n"
            f"   SOURCE: {it['source']['name']}\n\n"
            "1 haber çevir."
        )
        try:
            out = call_gemini(prompt)
        except Exception as exc:  # noqa: BLE001
            log(f"  [{i}/{limit}] HATA: {str(exc)[:110]}")
            continue
        row = (out or [{}])[0]
        tr = [
            re.sub(r"^\s*\[\d+\]\s*", "", str(p)).strip()
            for p in (row.get("paragraphs") or [])
        ]
        tr = [p for p in tr if len(p) >= 40]
        tr_chars = sum(len(p) for p in tr)
        if len(tr) < 2:
            log(f"  [{i}/{limit}] çeviri boş: {it['title'][:40]}")
            continue
        pct = round(tr_chars / src_chars * 100) if src_chars else 100
        if pct < 35:
            log(f"  [{i}/{limit}] eksik çeviri %{pct} atlandı")
            continue
        api_post(
            "/api/refill",
            {
                "items": [
                    {
                        "slug": it["slug"],
                        "body": tr,
                        "excerpt": row.get("excerpt") or it["excerpt"],
                    }
                ]
            },
        )
        log(f"  [{i}/{limit}] %{pct} · {len(tr)} paragraf · {it['title'][:44]}")
        time.sleep(0.4)

    log(f"bitti · atlanan (zaten tam): {atlandi}")


if __name__ == "__main__":
    main()
