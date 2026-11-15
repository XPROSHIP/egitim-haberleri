#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Türkiye Gazetesi Otomatik Tam Sayı Toplayıcı & FTP Yükleyici
- Sabah saatlerinde API sızıntısını probe eder.
- 16 sayfa linklerini yakaladığında sayfaları indirir, pypdf ile birleştirir.
- Birleştirilen tam PDF'i ftp.egitim.store üzerinden /public_html/gazeteler/ klasörüne yükler.
"""

import os
import sys
import time
import json
import ftplib
import tempfile
import urllib.request
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor

try:
    from pypdf import PdfWriter, PdfReader
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    from pypdf import PdfWriter, PdfReader

# Türkiye Zaman Dilimi (UTC+3)
TR_TZ = timezone(timedelta(hours=3))

API_URL = "https://api.turkiyegazetesi.com.tr/apps/newspaper/e-newspaper-detail"
USER_AGENT = "okhttp/4.12.0"

# FTP Bilgileri
FTP_HOST = "ftp.egitim.store"
FTP_USER = "omerzen@egitim.store"
FTP_PASS = "Omerzen/1982"
REMOTE_DIR = "gazeteler" # /public_html/gazeteler veya kök dizindeki gazeteler

def get_today_str():
    now = datetime.now(TR_TZ)
    return now.strftime("%Y-%m-%d")

def check_remote_pdf_exists(filename):
    """Halihazırda sunucuda bu PDF var mı ve boyutu geçerli mi kontrol eder."""
    url = f"https://egitim.store/gazeteler/{filename}"
    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("User-Agent", "Mozilla/5.0")
        with urllib.request.urlopen(req, timeout=5) as resp:
            cl = int(resp.headers.get("Content-Length", 0))
            if resp.status == 200 and cl > 1_000_000:
                return True
    except Exception:
        pass
    return False

def probe_and_fetch_pages(date_str, max_attempts=15, sleep_sec=2.0):
    """API'yi probe ederek 16 sayfalık tokenli linkleri yakalamaya çalışır."""
    for attempt in range(1, max_attempts + 1):
        cb = int(time.time() * 1000)
        url = f"{API_URL}?date={date_str}&_cb={cb}"
        req = urllib.request.Request(url)
        req.add_header("User-Agent", USER_AGENT)
        req.add_header("Accept", "application/json")

        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    payload = data.get("data") if isinstance(data, dict) and "data" in data else data
                    pages = []
                    if isinstance(payload, list):
                        pages = payload
                    elif isinstance(payload, dict):
                        pages = payload.get("pages") or payload.get("newspaperPages") or []

                    if len(pages) > 1:
                        print(f"[{date_str}] HARİKA! Sızıntı yakalandı: {len(pages)} sayfa tespit edildi!")
                        return pages
                    else:
                        print(f"[{date_str}] Deneme {attempt}/{max_attempts}: Henüz 1 sayfa dönüyor...")
        except Exception as e:
            print(f"[{date_str}] Deneme {attempt} hata: {e}")

        time.sleep(sleep_sec)
    return None

def download_page(item, tmp_dir):
    """Tek bir sayfayı indirip geçici dizine kaydeder."""
    page_no = item.get("pageNumber") or item.get("page") or 1
    pdf_url = item.get("pdfUrl") or item.get("url") or item.get("fileUrl") or item.get("pdf")
    if not pdf_url:
        return None

    dest = os.path.join(tmp_dir, f"page_{page_no:03d}.pdf")
    req = urllib.request.Request(pdf_url)
    req.add_header("User-Agent", USER_AGENT)

    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read()
                if content.startswith(b"%PDF"):
                    with open(dest, "wb") as f:
                        f.write(content)
                    return (page_no, dest)
        except Exception:
            time.sleep(1)
    return None

def merge_pdfs(page_files, output_pdf):
    """İndirilen sayfaları sırayla tek bir PDF'te birleştirir."""
    page_files.sort(key=lambda x: x[0])
    writer = PdfWriter()
    for page_no, fpath in page_files:
        try:
            reader = PdfReader(fpath)
            for page in reader.pages:
                writer.add_page(page)
        except Exception as e:
            print(f"Sayfa {page_no} eklenirken hata: {e}")
            return False

    with open(output_pdf, "wb") as f_out:
        writer.write(f_out)
    return os.path.exists(output_pdf) and os.path.getsize(output_pdf) > 1_000_000

def upload_via_ftp(local_file, remote_filename):
    """Birleştirilen PDF dosyasını egitim.store FTP sunucusuna yükler."""
    print(f"FTP'ye bağlanılıyor: {FTP_HOST}...")
    try:
        ftp = ftplib.FTP(FTP_HOST, timeout=30)
        ftp.login(FTP_USER, FTP_PASS)
        
        # Klasör kontrolü / geçişi
        try:
            ftp.cwd("public_html")
        except Exception:
            pass
        try:
            ftp.cwd(REMOTE_DIR)
        except Exception:
            ftp.mkd(REMOTE_DIR)
            ftp.cwd(REMOTE_DIR)

        print(f"Dosya aktarılıyor: {remote_filename} ({os.path.getsize(local_file) / (1024*1024):.2f} MB)...")
        with open(local_file, "rb") as f:
            ftp.storbinary(f"STOR {remote_filename}", f)

        ftp.quit()
        print("FTP yüklemesi başarıyla tamamlandı!")
        return True
    except Exception as e:
        print(f"FTP yükleme hatası: {e}")
        return False

def main():
    target_date = get_today_str()
    filename = f"turkiye-gazetesi-{target_date}.pdf"

    print(f"=== Türkiye Gazetesi Hasat İşlemi Başladı ({target_date}) ===")

    # 1. Zaten var mı kontrol et
    if check_remote_pdf_exists(filename):
        print(f"{filename} zaten egitim.store üzerinde mevcut ve geçerli. İşlem tamam.")
        return 0

    # 2. API'yi probe et
    pages = probe_and_fetch_pages(target_date, max_attempts=20, sleep_sec=2.5)
    if not pages or len(pages) < 2:
        print(f"Şu an için sızıntı yakalanamadı. Bir sonraki cron tetiklemesinde tekrar denenecek.")
        return 0

    # 3. İndir ve birleştir
    with tempfile.TemporaryDirectory() as tmp_dir:
        print(f"{len(pages)} sayfa paralel indiriliyor...")
        with ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(lambda p: download_page(p, tmp_dir), pages))

        valid_results = [r for r in results if r is not None]
        print(f"{len(valid_results)}/{len(pages)} sayfa başarıyla indirildi.")

        if len(valid_results) < len(pages):
            print("Bazı sayfalar indirilemedi, birleştirme iptal edildi.")
            return 1

        local_pdf = os.path.join(tmp_dir, filename)
        if not merge_pdfs(valid_results, local_pdf):
            print("PDF birleştirme başarısız.")
            return 1

        # 4. FTP ile yükle
        if upload_via_ftp(local_pdf, filename):
            print(f"GÜNCEL SAYI YAYINDA: https://egitim.store/gazeteler/{filename}")
            return 0

    return 1

if __name__ == "__main__":
    sys.exit(main())

