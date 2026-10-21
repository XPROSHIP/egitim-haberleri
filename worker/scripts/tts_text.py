"""
Seslendirme (TTS) için metin temizleme.

EMA Lightning bazı durumlarda noktalama işaretlerini de sesli okuyor
("nokta", "virgül") ve tam büyük harfli kısaltmaları harf harf söylüyor
(MESEM -> "Me Se E Me", ALES -> "A Le E Se"). Bu modül metni okunabilir
hale getirir: noktalama kaldırılır, kısaltmalar sözlü biçime çevrilir,
bilinen yanlış telaffüzler düzeltilir.

Aynı kuralların TypeScript karşılığı `src/lib/ttsText.ts` içindedir.
"""

import re

# Bilinen telaffüz düzeltmeleri (küçük harfli eşleşme yapılır).
PRONUNCIATIONS = {
    "karekökü": "kare kökü",
    "karekök": "kare kök",
    "karekökler": "kare kökler",
    "logaritma": "logaritma",
    "türev": "türev",
    "integral": "integral",
    "integrali": "integrali",
    "öğretmenler": "öğretmenler",
    "bakanlığı": "bakanlığı",
    "bakanlık": "bakanlık",
    "i̇nternet": "internet",
    "internet": "internet",
    "youtube": "youtub",
    "linkedin": "linkedin",
    "whatsapp": "vatsap",
    "tiktok": "tiktok",
    "ekşi sözlük": "ekşi sözlük",
    "t.c.": "T C",
    "a.v.": "A V",
    "ö.s.y.m": "Ö S Y M",
    "vs.": "ve benzeri",
    "vb.": "ve benzeri",
    "örn.": "örneğin",
    "bkz.": "bakınız",
    "dr.": "doktor",
    "doç.": "doçent",
    "prof.": "profesör",
    "drl.": "doktor",
    "sn.": "saniye",
    "dk.": "dakika",
    "sa.": "saat",
    "sf.": "sanfiyye",
    "kr.": "kuruş",
    "gb": "gigabayt",
    "mb": "megabayt",
    "kb": "kilobayt",
    "tb": "terabayt",
    "tl": "lira",
    "usd": "dolar",
    "eur": "euro",
    "öğr.": "öğrenci",
    "yayın": "yayın",
    "meb": "Meb",
    "mesem": "Mesem",
    "yök": "Yök",
    "kpss": "Kpss",
    "ösym": "Ösym",
    "ales": "Ales",
    "tyt": "Tyt",
    "ayt": "Ayt",
    "lgs": "Lgs",
    "yks": "Yks",
    "sks": "Sks",
    "ales/3": "ales üç",
    "obn": "Obn",
    "aime": "Aime",
    "aöf": "Aöf",
    "bilsem": "Bilsem",
    "tübitak": "Tübitak",
    "tubitak": "Tübitak",
    "yüks": "Yüks",
}

# Sembollerin okunuşu.
SYMBOLS = {
    "%": " yüzde ",
    "&": " ve ",
    "+": " artı ",
    "=": " eşittir ",
    "@": " at ",
    "#": " numara ",
    "€": " avro ",
    "$": " dolar ",
    "£": " sterlin ",
    "°": " derece ",
    "½": " yarım ",
    "¼": " çeyrek ",
    "×": " çarpı ",
    "÷": " bölü ",
    "±": " artı eksi ",
    "→": " yönünde ",
    "±": " artı eksi ",
}

# Kısaltma gibi görünen ama büyük harfli olmayan kelimeler: dokunma.
_KEEP = re.compile(r"^[A-ZÇĞİÖŞÜ]{2,}$")


def _fix_pronunciations(text: str) -> str:
    low = text.lower()
    for needle, replacement in PRONUNCIATIONS.items():
        if needle in low:
            # Orijinal büyük/küçük harf yapısını korumak için düz kelimeyle değiştir.
            low = low.replace(needle, replacement)
    return low


def _symbols(text: str) -> str:
    for sym, rep in SYMBOLS.items():
        text = text.replace(sym, rep)
    return text


def _acronyms(text: str) -> str:
    """Tam büyük harfli kısaltmaları tek sözcük hâline getirir (MESEM -> Mesem)."""

    def repl(match):
        word = match.group(0)
        if len(word) < 2:
            return word
        if word in ("I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"):
            return word
        # "COVID-19" gibi olanlar: parçaları ayrı ayrı çevrilir.
        if "-" in word:
            return "-".join(
                (p.capitalize() if _KEEP.match(p) else p) for p in word.split("-")
            )
        return word.capitalize()

    return re.sub(r"[A-ZÇĞİÖŞÜ]{2,}", repl, text)


def _punctuation(text: str) -> str:
    """Noktalama işaretlerini kaldırır; cümle sonu için kısa boşluk bırakır."""
    # Tirnak işaretleri de okunmasın.
    text = re.sub(r"[\"“”„«»'‘’]", " ", text)
    # Noktalama: nokta, virgül, üst üste, soru, ünlem, iki nokta, tire, eğik çizgi
    text = re.sub(r"[.,;:!?\-\u2013\u2014()\[\]{}…/\\|]+", " ", text)
    return text


def clean_for_tts(text: str) -> str:
    """Metni seslendirme için temizler: noktalama yok, kısaltmalar okunur."""
    if not text:
        return ""
    out = _fix_pronunciations(str(text))
    out = _symbols(out)
    out = _acronyms(out)
    out = _punctuation(out)
    # Tekrarlı boşluklar
    out = re.sub(r"\s+", " ", out).strip()
    return out


if __name__ == "__main__":
    import sys

    sample = sys.argv[1] if len(sys.argv) > 1 else (
        "MESEM'in 2026 yılı burs sayısı 1.250 TL oldu. ALES/3 başvuruları 12 Şubat'ta başlıyor. "
        "Karekök ve integral konularında %30 artış beklentisi var! ÖSYM duyurdu, Dr. Ahmet 'son derece önemli' dedi."
    )
    print(clean_for_tts(sample))
