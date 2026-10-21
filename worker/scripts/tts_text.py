"""
Seslendirme (TTS) metin hazırlığı.

EMA Lightning'in metin ön işleyicisi (normalizer_tr) şunları yapar:
  * virgül, nokta, iki nokta, noktalı virgül, ünlem, soru işareti, tırnak,
    parantez OLDUĞU GİBİ bırakılır — model bunları prozodi (duraklama)
    için kullanır. Bunlar SILINMEZ.
  * tire ("tire"), eğik çizgi ("eğik çizgi") gibi işaretleri SESLİ okur.
    Bunlar sessiz harflerle değiştirilir.
  * sayı, tarih, saat, para, yüzde doğru okunur (dokunulmaz).
  * kısaltmaları (ALES, KPSS...) harf harf okur. Bunlar açılımlarıyla
    değiştirilir.

Aynı kuralların TypeScript karşılığı `src/lib/ttsText.ts` içindedir.
"""

import re

# Kısaltmalar: sesli okunabilir açılımlarıyla değiştirilir.
# (Model "ALES"i "a le e se" diye okuyor.)
ACRONYMS = {
    "MESEM": "Mesleki Eğitim Merkezi",
    "MEB": "Milli Eğitim Bakanlığı",
    "YÖK": "Yükseköğretim Kurulu",
    "ÖSYM": "Öğrenci Seçme ve Yerleştirme Merkezi",
    "ALES": "Akademik Personel ve Lisans Sınavı",
    "KPSS": "Kamu Personeli Seçme Sınavı",
    "YKS": "Yükseköğretim Kurulu Sınavı",
    "TYT": "Temel Yerleştirme Testi",
    "AYT": "Alan Yeterlilik Testi",
    "LGS": "Liseye Geçiş Sınavı",
    "AÖF": "Açıköğretim Fakültesi",
    "TYT/AYT": "Temel ve Alan Yeterlilik Testleri",
    "YKS/ALS": "Yükseköğretim Kurulu ve Alan Yeterlilik Sınavı",
    "T.C.": "Türkiye Cumhuriyeti",
    "SGK": "Sosyal Güvenlik Kurumu",
}

# Yanlış telaffüz düzeltmeleri (küçük harfli eşleşme yapılır).
PRONUNCIATIONS = {
    "karekökü": "kare kökü",
    "karekök": "kare kök",
    "karekökler": "kare kökler",
    "karekok": "kare kök",
    "youtube": "youtub",
    "whatsapp": "vatsap",
    "ekşi sözlük": "ekşi sözlük",
    "tübitak": "Tübitak",
    "bilsem": "Bilsem",
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
    "gb": "gigabayt",
    "mb": "megabayt",
    "kb": "kilobayt",
    "tb": "terabayt",
    "tl": "lira",
    "usd": "dolar",
    "eur": "euro",
}

# Modelin SESLİ okuduğu işaretler: sessiz karşılıklarıyla değiştirilir.
# (normalizer bunları "tire", "eğik çizgi" gibi okur.)
READ_ALOUD = {
    "-": " ",      # tire
    "–": " ",      # yarım tire
    "—": " ",      # uzun tire
    "−": " ",      # eksi işareti
    "/": " ",      # eğik çizgi
    "\\": " ",     # ters eğik çizgi
    "|": " ",      # dikey çizgi
    "•": ", ",     # madde işareti
    "·": ", ",     # orta nokta
    "*": " ",      # yıldız
    "#": " numara ",
    "@": " at ",
    "_": " ",
    "…": "...",    # üç nokta (modelin sözlüğünde var)
    "“": '"',
    "”": '"',
    "„": '"',
    "«": '"',
    "»": '"',
    "‘": "'",
    "’": "'",
}

# Virgül, nokta, iki nokta, noktalı virgül, ünlem ve soru işareti
# KORUNUR: model bunları duraklama için kullanır.
KEEP_PUNCTUATION = ".,;:!?\"'()"


def _apply_read_aloud(text: str) -> str:
    for ch, rep in READ_ALOUD.items():
        text = text.replace(ch, rep)
    return text


def _apply_acronyms(text: str) -> str:
    # Uzun ifadeler önce (TYT/AYT gibi), sonra tek tek.
    for key in sorted(ACRONYMS, key=len, reverse=True):
        if key not in text:
            continue
        name = ACRONYMS[key]
        # "Milli Eğitim Bakanlığı (MEB)" -> "Milli Eğitim Bakanlığı"
        # (parantez içindeki kısaltma zaten biraz önce açıldıysa gereksiz)
        pattern = re.compile(
            r"([\wÇĞİÖŞÜçğıöşü ,.'-]{0,80}?)\s*\(" + re.escape(key) + r"\)"
        )

        def repl(m):
            before = m.group(1)
            head = name.split()[0].lower()
            return before if head and head in before.lower() else m.group(0)

        text = pattern.sub(repl, text)
        text = text.replace(key, name)
    return text


def _apply_pronunciations(text: str) -> str:
    low = text.lower()
    for needle, replacement in PRONUNCIATIONS.items():
        if needle in low:
            low = low.replace(needle, replacement)
    return low


def _fix_number_dots(text: str) -> str:
    """'1. madde' -> 'bir. madde' okunmasın diye sayı sonrası nokta temizlenir."""
    return re.sub(r"(?<=\d)\.(?=\s|$)", " ", text)


def clean_for_tts(text: str) -> str:
    """
    Metni seslendirme için hazırlar.

    - Noktalama korunur (virgül/nokta/ünlem/soru) → doğal duraklamalar.
    - Modelin sesli okuduğu işaretler (tire, eğik çizgi) sessize çevrilir.
    - Kısaltmalar açılımlarıyla değiştirilir (ALES -> Akademik Personel ...).
    - Yanlış telaffüzler düzeltilir (karekök -> kare kök).
    """
    if not text:
        return ""
    out = str(text)
    # Sıra önemli: kısaltmalar büyük harfli hâliyle aranır, telaffüz
    # düzeltmeleri ise metni küçük harfe indirir.
    out = _apply_acronyms(out)
    out = _apply_read_aloud(out)
    out = _apply_pronunciations(out)
    out = _fix_number_dots(out)
    # Tekrarlı boşluklar (noktalama korunur, sadece boşluklar düzenlenir)
    out = re.sub(r"[ \t]+", " ", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


if __name__ == "__main__":
    import sys

    from normalizer_tr import Normalizer

    sample = sys.argv[1] if len(sys.argv) > 1 else (
        'MESEM, 2026-2027 eğitim yılında ALES/3 başvurularını 12 Şubat\'ta '
        'açıklayacak. "Karekök" konusunda %30 artış beklentisi var. Dr. Ahmet, '
        '"çok önemli" dedi!'
    )
    prepared = clean_for_tts(sample)
    print("HAZIRLANAN :", prepared)
    print("NORMALİZE  :", Normalizer().normalize(prepared, ambiguity_policy="fallback").normalized_text)
