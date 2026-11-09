#!/usr/bin/env node
/**
 * egitim.store — Otomatik Günlük e-Gazete Arşivleme ve Senkronizasyon Motoru
 * Zamanlama: 01:00, 05:00, 08:00, 12:00, 16:00 (TSI)
 */

import * as ftp from 'basic-ftp'
import { PDFDocument } from 'pdf-lib'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const FTP_HOST = 'ftp.egitim.store'
const FTP_USER = 'omerzen@egitim.store'
const FTP_PASS = 'Omerzen/1982'
const FTP_DIR = 'gazeteler'
const MANIFEST_FILE = 'manifest.json'
const BASE_HTTP_URL = 'https://egitim.store/gazeteler/'
const API_URL = 'https://corummesem.com.tr/api/gazeteler?fresh=1'

const TR_MAP = {
  'ç': 'c', 'Ç': 'C',
  'ğ': 'g', 'Ğ': 'G',
  'ı': 'i', 'İ': 'I',
  'ö': 'o', 'Ö': 'O',
  'ş': 's', 'Ş': 'S',
  'ü': 'u', 'Ü': 'U'
}

const TR_MONTHS_MAP = {
  'ocak': '01', 'subat': '02', 'şubat': '02', 'mart': '03', 'nisan': '04',
  'mayis': '05', 'mayıs': '05', 'haziran': '06', 'temmuz': '07', 'agustos': '08', 'ağustos': '08',
  'eylul': '09', 'eylül': '09', 'ekim': '10', 'kasim': '11', 'kasım': '11', 'aralik': '12', 'aralık': '12'
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export function getStandardPdfName(name, dateStr) {
  let clean = String(name || '').trim()
  clean = clean.replace(/\s+Gazetesi?$/i, '')
  for (const [tr, en] of Object.entries(TR_MAP)) {
    clean = clean.replaceAll(tr, en)
  }
  clean = clean.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')

  let iso = null
  if (dateStr) {
    const mIso = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (mIso) {
      iso = `${mIso[1]}-${String(mIso[2]).padStart(2, '0')}-${String(mIso[3]).padStart(2, '0')}`
    } else {
      const mDot = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
      if (mDot) {
        iso = `${mDot[3]}-${String(mDot[2]).padStart(2, '0')}-${String(mDot[1]).padStart(2, '0')}`
      } else {
        const mTxt = dateStr.match(/(\d{1,2})\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\s+(\d{4})/)
        if (mTxt) {
          const moNum = TR_MONTHS_MAP[mTxt[2].toLowerCase()] || '01'
          iso = `${mTxt[3]}-${moNum}-${String(mTxt[1]).padStart(2, '0')}`
        }
      }
    }
  }

  if (!iso) {
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000)
    iso = now.toISOString().slice(0, 10)
  }

  return { fileName: `${clean}_${iso}.pdf`, cleanName: clean, isoDate: iso }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const fullUrl = url.startsWith('/') ? 'https://corummesem.com.tr' + url : url
    const headers = { 'User-Agent': UA, ...(options.headers || {}) }
    const res = await fetch(fullUrl, { ...options, headers, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function imagesToPdf(imageBuffers) {
  const pdfDoc = await PDFDocument.create()
  const tempDir = os.tmpdir()

  for (let i = 0; i < imageBuffers.length; i++) {
    let buf = imageBuffers[i]
    if (!buf || buf.length < 100) continue

    const u8 = new Uint8Array(buf.buffer || buf, buf.byteOffset || 0, Math.min(12, buf.length || buf.byteLength))
    const isJpg = u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff
    const isPng = u8.length >= 4 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47

    let embeddedImg
    if (isJpg) {
      embeddedImg = await pdfDoc.embedJpg(buf)
    } else if (isPng) {
      embeddedImg = await pdfDoc.embedPng(buf)
    } else {
      try {
        const inPath = path.join(tempDir, `tmp_page_${Date.now()}_${i}.webp`)
        const outPath = path.join(tempDir, `tmp_page_${Date.now()}_${i}.jpg`)
        fs.writeFileSync(inPath, buf)
        execSync(`python -c "from PIL import Image; Image.open(r'${inPath}').convert('RGB').save(r'${outPath}', quality=95)"`, { timeout: 10000 })
        const jpgBuf = fs.readFileSync(outPath)
        embeddedImg = await pdfDoc.embedJpg(jpgBuf)
        try { fs.unlinkSync(inPath) } catch {}
        try { fs.unlinkSync(outPath) } catch {}
      } catch (err) {
        console.warn(`      [Uyarı] Sayfa ${i + 1} dönüştürülemedi:`, err.message)
        continue
      }
    }

    if (embeddedImg) {
      const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height])
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: embeddedImg.width,
        height: embeddedImg.height,
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

async function ensureFtp(client) {
  if (client.closed) {
    client.ftp.timeout = 300000
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false
    })
    await client.cd(FTP_DIR)
  }
}

async function runArchive() {
  const turkeyNow = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  console.log(`\n=======================================================`)
  console.log(`  📰 egitim.store e-Gazete Otomatik Arşivleme Motoru`)
  console.log(`  🕒 Zaman: ${turkeyNow} (TSI / UTC+3)`)
  console.log(`=======================================================\n`)

  // 1. Canlı gazete verisini çek
  console.log(`[*] Canlı gazete verisi çekiliyor: ${API_URL}`)
  let tamSayiList = []
  try {
    const apiRes = await fetchWithTimeout(API_URL)
    if (!apiRes.ok) throw new Error(`HTTP ${apiRes.status}`)
    const apiData = await apiRes.json()
    tamSayiList = apiData.tam_sayi || []
  } catch (err) {
    console.error(`[!] API çekilemedi: ${err.message}`)
    return
  }

  console.log(`[✓] ${tamSayiList.length} adet gazete yayını tespit edildi.`)

  // 2. FTP bağlantısı kur
  console.log(`[*] FTP sunucusuna bağlanılıyor: ${FTP_HOST}/${FTP_DIR}`)
  const client = new ftp.Client()
  client.ftp.verbose = false
  client.ftp.timeout = 300000 // 5 dakika soket zaman aşımı

  let manifest = { title: 'egitim.store e-Gazete Arşivi', updatedAt: '', files: {} }
  const tempDir = os.tmpdir()

  try {
    await ensureFtp(client)

    // Manifest'i çek
    const localManifestTmp = path.join(tempDir, `manifest_${Date.now()}.json`)
    try {
      await client.downloadTo(localManifestTmp, MANIFEST_FILE)
      const rawText = fs.readFileSync(localManifestTmp, 'utf-8')
      manifest = JSON.parse(rawText)
      try { fs.unlinkSync(localManifestTmp) } catch {}
    } catch {
      console.log(`[*] Yeni manifest.json oluşturuluyor.`)
    }

    if (!manifest.files) manifest.files = {}
    console.log(`[✓] Mevcut arşivde ${Object.keys(manifest.files).length} adet kayıtlı dosya var.\n`)

    let uploadedCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (let idx = 0; idx < tamSayiList.length; idx++) {
      const g = tamSayiList[idx]
      const { fileName, cleanName, isoDate } = getStandardPdfName(g.name, g.date)

      // Zaten yüklü mü kontrol et
      if (manifest.files[fileName] && manifest.files[fileName].size > 20000) {
        const mb = (manifest.files[fileName].size / (1024 * 1024)).toFixed(2)
        console.log(`[${idx + 1}/${tamSayiList.length}] [ATLANDI] ${fileName} (${mb} MB) zaten arşivde mevcut.`)
        skippedCount++
        continue
      }

      console.log(`[${idx + 1}/${tamSayiList.length}] [İŞLENİYOR] ${g.name} (${g.date}) -> ${fileName}`)
      let pdfBuffer = null

      // A. Doğrudan PDF var mı?
      if (g.pdf && g.pdf.startsWith('http') && !g.pdf.includes('egitim.store')) {
        console.log(`    -> Doğrudan PDF indiriliyor: ${g.pdf.slice(0, 75)}...`)
        try {
          const pdfRes = await fetchWithTimeout(g.pdf, { headers: { Referer: 'https://corummesem.com.tr/' } })
          if (pdfRes.ok) {
            const arr = await pdfRes.arrayBuffer()
            const buf = Buffer.from(arr)
            if (buf.length > 20000 && buf.subarray(0, 5).toString().startsWith('%PDF-')) {
              pdfBuffer = buf
              console.log(`    [✓] Orijinal PDF indirildi (${(buf.length / (1024 * 1024)).toFixed(2)} MB)`)
            }
          }
        } catch (err) {
          console.warn(`    [!] PDF indirme hatası:`, err.message)
        }
      }

      // B. Çok sayfalı resimler var mı? (Sözcü, Posta, Yeniçağ, Fanatik, Analiz, Anayurt vb.)
      if (!pdfBuffer && Array.isArray(g.pages) && g.pages.length > 0) {
        console.log(`    -> Çok sayfalı baskı (${g.pages.length} sayfa). Sayfalar indiriliyor...`)
        const pageBuffers = []
        for (let pIdx = 0; pIdx < g.pages.length; pIdx++) {
          const p = g.pages[pIdx]
          const imgUrl = p.img || p.thumb
          if (!imgUrl) continue
          try {
            const pageRes = await fetchWithTimeout(imgUrl, { headers: { Referer: 'https://corummesem.com.tr/' } }, 15000)
            if (pageRes.ok) {
              const pBuf = Buffer.from(await pageRes.arrayBuffer())
              if (pBuf.length > 3000) {
                pageBuffers.push(pBuf)
              }
            }
          } catch {}
        }

        if (pageBuffers.length >= Math.max(1, Math.floor(g.pages.length * 0.7))) {
          console.log(`    [*] ${pageBuffers.length} sayfa tek bir PDF'e birleştiriliyor...`)
          try {
            pdfBuffer = await imagesToPdf(pageBuffers)
            console.log(`    [✓] Çok sayfalı PDF üretildi (${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB)`)
          } catch (err) {
            console.error(`    [!] PDF birleştirme hatası:`, err.message)
          }
        }
      }

      // C. PDF hazırsa geçici dosyaya yazıp FTP'ye yükle
      if (pdfBuffer && pdfBuffer.length > 20000) {
        const localUploadTmp = path.join(tempDir, `upload_${Date.now()}_${fileName}`)
        try {
          fs.writeFileSync(localUploadTmp, pdfBuffer)
          await ensureFtp(client)
          console.log(`    -> FTP'ye yükleniyor: ${fileName} (${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB)...`)
          await client.uploadFrom(localUploadTmp, fileName)
          
          manifest.files[fileName] = {
            name: g.name,
            cleanName,
            date: g.date,
            iso: isoDate,
            size: pdfBuffer.length,
            url: `${BASE_HTTP_URL}${fileName}`,
            uploadedAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
          }
          uploadedCount++
          console.log(`    [✓] YÜKLENDİ: ${BASE_HTTP_URL}${fileName}\n`)
        } catch (err) {
          console.error(`    [!] FTP yükleme hatası:`, err.message)
          failedCount++
        } finally {
          try { fs.unlinkSync(localUploadTmp) } catch {}
        }
      } else {
        console.log(`    [!] PDF içeriği elde edilemedi.\n`)
        failedCount++
      }
    }

    // 4. Manifest'i kaydet
    manifest.updatedAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    const manifestTmp = path.join(tempDir, `final_manifest_${Date.now()}.json`)
    fs.writeFileSync(manifestTmp, JSON.stringify(manifest, null, 2), 'utf-8')
    await ensureFtp(client)
    await client.uploadFrom(manifestTmp, MANIFEST_FILE)
    try { fs.unlinkSync(manifestTmp) } catch {}
    console.log(`[✓] manifest.json başarıyla güncellendi (${Object.keys(manifest.files).length} dosya).`)

    console.log(`\n=======================================================`)
    console.log(`  🏁 Arşivleme Tamamlandı`)
    console.log(`  • Yeni Yüklenen: ${uploadedCount}`)
    console.log(`  • Zaten Mevcut (Atlanan): ${skippedCount}`)
    console.log(`  • Başarısız/Eksik: ${failedCount}`)
    console.log(`=======================================================\n`)
  } finally {
    client.close()
  }
}

runArchive().catch(console.error)
