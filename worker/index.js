/**
 * Cloudflare Worker — Eğitim Haberleri
 *
 *  · GET  /api/news        → yayındaki haberler (CDN önbellekli)
 *  · GET  /api/news/:slug  → tek haber
 *  · GET  /img/:key        → haber görseli (D1'de saklanır)
 *  · POST /api/collect     → GitHub Actions'ın topladığı haberleri yazar
 *  · POST /api/image       → GitHub Actions'ın yüklediği görsel
 *  · GET  /api/health      → durum
 *
 * Burada bilerek toplama yapılmıyor. Workers Free kademesinde tek bir
 * çalıştırmaya 10 ms CPU tanınıyor; toplayıcı ise yüzlerce sayfa çekip
 * HTML ayrıştırdığı için ~200 ms harcıyor ve işlem kesiliyor. Ağır iş
 * GitHub Actions'ta çalışır, sonucu buraya POST eder.
 *
 * Görseller R2 yerine D1'de tutuluyor: R2'nin ücretsiz kademesi bile
 * kredi kartı istiyor, D1 ise istemiyor ve çıkış trafiği ücreti almıyor.
 */
import { createD1Store, createMemoryStore, fromRow } from './src/store.js'
import {
  answer,
  bumpQuota,
  listMessages,
  quotaOf,
  saveMessage,
  searchNews,
} from './src/assistant.js'
import { getGazeteler } from './src/gazeteler.js'

/**
 * CORS basliklari istege gore uretilir.
 * "Authorization" basligi gonderen isteklerde Chrome joker "*" degerini kabul
 * etmez; tam origin dondurulmek zorundadir. Aksi halde tarayici istegi
 * engeller ve "Failed to fetch" hatasi verir.
 */
function corsFor(request) {
  const origin = request.headers.get('origin')
  return {
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-headers': 'content-type, authorization, x-collect-secret',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

const json = (body, status = 200, extra = {}, cors = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors, ...extra },
  })

function store(env) {
  if (env.DB) return createD1Store(env.DB)
  return createMemoryStore()
}

const authorized = (request, env) => {
  const secret = request.headers.get('x-collect-secret')
  return Boolean(env.COLLECT_SECRET) && secret === env.COLLECT_SECRET
}

/**
 * D1 BLOB sütununu bayt dizisine çevirir.
 * D1 sürüme göre ArrayBuffer, Uint8Array ya da sayı dizisi döndürebiliyor;
 * hepsini destekliyoruz çünkü new Response() yalnızca ilk ikisini kabul eder.
 */
function toBytes(value) {
  if (!value) return null
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  if (Array.isArray(value)) return Uint8Array.from(value)
  if (typeof value === 'string') {
    // base64 gelen satırlar
    try {
      const bin = atob(value)
      const out = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
      return out
    } catch {
      return null
    }
  }
  return null
}

/**
 * Supabase oturum jetonundan kullanıcı kimliğini dogrular.
 * Jeton Supabase tarafindan imzalanir; istemcinin gonderdigi id'ye guvenilmez.
 */
async function currentUser(request, env) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const base = (env.SUPABASE_URL ?? '').replace(/\/$/, '')
  if (!base) return null
  try {
    const res = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY ?? '', Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const user = await res.json()
    return user?.id
      ? { id: user.id, name: user.user_metadata?.full_name ?? user.email ?? 'Kullanıcı' }
      : null
  } catch {
    return null
  }
}

/** Kısa, kararlı karma (abonelik uç noktası için). */
function hashString(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

/** Sistemin durumunu D1'de tutar: tetikleme basarisi, son toplama zamani.
    Boylece token bozulursa hatirlamak yerine site uyariyor. */
async function recordState(env, key, value) {
  try {
    await env.DB.prepare(
      `INSERT INTO system_state (key, value, updated_at) VALUES (?,?,datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`,
    )
      .bind(key, JSON.stringify(value))
      .run()
  } catch (err) {
    console.error('[worker] durum yazilamadi', String(err?.message ?? err).slice(0, 100))
  }
}

async function readState(env, key) {
  try {
    const row = await env.DB.prepare('SELECT value, updated_at FROM system_state WHERE key = ?')
      .bind(key)
      .first()
    if (!row) return null
    return { ...JSON.parse(row.value), updatedAt: row.updated_at }
  } catch {
    return null
  }
}
/** GitHub iş akışını tetikler. Hata ayrıntısını döndürür. */
async function dispatchCollect(env) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return { ok: false, error: 'GITHUB_TOKEN veya GITHUB_REPO tanimli degil' }
  }
  try {
    const res = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/collect.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.GITHUB_TOKEN}`,
          accept: 'application/vnd.github+json',
          // GitHub REST API'si User-Agent başlığı olmadan isteği reddediyor
          // ("Request forbidden by administrative rules").
          'user-agent': 'EgitimHaberleri-Worker',
          'x-github-api-version': '2022-11-28',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      },
    )
    const detail = res.status === 204 ? '' : (await res.text()).slice(0, 300)
    console.log(`[worker] tetikleme -> HTTP ${res.status} ${detail}`)
    await recordState(env, 'dispatch', {
      ok: res.status === 204,
      status: res.status,
      error: detail || undefined,
      at: new Date().toISOString(),
    })
    return {
      ok: res.status === 204,
      status: res.status,
      error: res.status === 204 ? undefined : detail,
    }
  } catch (err) {
    const message = String(err?.message ?? err).slice(0, 200)
    console.error('[worker] tetikleme hatasi', message)
    await recordState(env, 'dispatch', { ok: false, error: message, at: new Date().toISOString() })
    return { ok: false, error: message }
  }
}

/** 500 MB tavanı olan tek bir D1 veritabanı için güvenli yazma sınırı (460 MB) */
const SHARD_LIMIT_BYTES = 460 * 1024 * 1024

/** Tüm bağlı ses veritabanlarını sırayla döndürür (7 adede kadar) */
function getAudioDbs(env) {
  return [
    env.DB_AUDIO,
    env.DB_AUDIO_2,
    env.DB_AUDIO_3,
    env.DB_AUDIO_4,
    env.DB_AUDIO_5,
    env.DB_AUDIO_6,
    env.DB_AUDIO_7,
  ].filter(Boolean)
}

/** Tüm bağlı görsel veritabanlarını sırayla döndürür (2 adede kadar) */
function getImageDbs(env) {
  return [
    env.DB_IMAGES,
    env.DB_IMAGES_2,
  ].filter(Boolean)
}

/** Sesi tüm ses veritabanlarında arar (en güncelden eskiye doğru) */
async function findAudio(env, id) {
  const dbs = getAudioDbs(env)
  for (let i = dbs.length - 1; i >= 0; i--) {
    try {
      const row = await dbs[i]
        .prepare('SELECT data, type, duration, recipe FROM news_audio WHERE article_id = ?')
        .bind(id)
        .first()
      if (row && row.data) return { row, db: dbs[i], index: i }
    } catch {}
  }
  return null
}

/** Görseli tüm görsel veritabanlarında arar (en güncelden eskiye doğru) */
async function findImage(env, key) {
  const dbs = getImageDbs(env)
  for (let i = dbs.length - 1; i >= 0; i--) {
    try {
      const row = await dbs[i]
        .prepare('SELECT data, type FROM images WHERE key = ?')
        .bind(key)
        .first()
      if (row && row.data) return { row, db: dbs[i], index: i }
    } catch {}
  }
  return null
}

/** Yeni ses için yazılabilir veritabanını seçer. 460 MB doldukça bir sonrakine geçer. */
async function getWritableAudioDb(env) {
  const dbs = getAudioDbs(env)
  for (const db of dbs) {
    try {
      const res = await db.prepare('SELECT COALESCE(SUM(bytes), 0) AS total FROM news_audio').first()
      const total = Number(res?.total ?? 0)
      if (total < SHARD_LIMIT_BYTES) {
        return db
      }
    } catch {
      return db
    }
  }
  return dbs[dbs.length - 1]
}

/** Yeni görsel için yazılabilir veritabanını seçer. 460 MB doldukça bir sonrakine geçer. */
async function getWritableImageDb(env) {
  const dbs = getImageDbs(env)
  for (const db of dbs) {
    try {
      const res = await db.prepare('SELECT COALESCE(SUM(bytes), 0) AS total FROM images').first()
      const total = Number(res?.total ?? 0)
      if (total < SHARD_LIMIT_BYTES) {
        return db
      }
    } catch {
      return db
    }
  }
  return dbs[dbs.length - 1]
}

export default {
  /**
   * Zamanlayıcı: GitHub iş akışını tetikler.
   *
   * Neden Worker cron'u: GitHub'ın kendi zamanlayıcısı yeni oluşturulan
   * depolarda saatlerce (bazen hiç) tetiklenmiyor. Cloudflare'ın cron'u
   * güvenilir ve tek bir HTTP çağrısı yaptığı için CPU limitinin çok altında.
   * Ağır iş yine GitHub Actions'ta (2.000 dk/ay) yapılır.
   */
  async scheduled(controller, env) {
    controller.noRetry()

    // Ses/görsel temizliği artık sabit gün sayısına göre değil, kota bazlı:
    // /api/storage/prune her turda bütçeyi ölçer ve yalnızca taşarsa en
    // eskileri siler. Burada ayrıca bir yaş kuralı uygulanmaz.

    await dispatchCollect(env)
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const cors = corsFor(request)
    /** Bu isteğe ait CORS başlıklarıyla JSON döndürür. */
    const reply = (body, status = 200, extra = {}) => json(body, status, extra, cors)

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })

    // Haber görselleri
    // Not: D1, BLOB sütununu normal sorguda sayı dizisi olarak döndürüyor;
    // new Response() onu boş gövdeye çeviriyor. Dönüş biçimi sürüme göre
    // değişebildiği için hepsini karşılayacak şekilde dönüştürüyoruz.
    // Haber sesi (EMA Lightning ile üretilmiş MP3 - 7 veritabanı shard'ında aranır)
    if (url.pathname.startsWith('/api/audio/') && request.method === 'GET') {
      const id = decodeURIComponent(url.pathname.slice('/api/audio/'.length))
      const found = await findAudio(env, id)
      const row = found?.row
      const bytes = toBytes(row?.data)
      if (!bytes) return new Response('Not found', { status: 404 })

      const total = bytes.byteLength
      const range = request.headers.get('range')
      const contentType = row?.type ?? 'audio/mpeg'
      const cors = corsFor(request)

      if (range && range.startsWith('bytes=')) {
        const parts = range.slice(6).split('-')
        const start = parseInt(parts[0], 10) || 0
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1
        if (start < total && end < total && start <= end) {
          const chunk = bytes.subarray(start, end + 1)
          return new Response(chunk, {
            status: 206,
            headers: {
              'content-type': contentType,
              'content-range': `bytes ${start}-${end}/${total}`,
              'content-length': String(chunk.byteLength),
              'accept-ranges': 'bytes',
              'cache-control': 'public, max-age=31536000, immutable',
              ...cors,
            },
          })
        }
      }

      return new Response(bytes, {
        headers: {
          'content-type': contentType,
          'content-length': String(total),
          'accept-ranges': 'bytes',
          'content-disposition': `attachment; filename="${id.replace(/[^a-zA-Z0-9._-]/g, '_')}.mp3"`,
          'cache-control': 'public, max-age=31536000, immutable',
          ...cors,
        },
      })
    }

    // Ses yükleme (yalnızca toplayıcı)
    if (url.pathname === '/api/audio' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const id = url.searchParams.get('id') ?? ''
      if (!id || id.length > 120) return reply({ error: 'invalid_id' }, 400)
      // Gereksiz kopya yok: gövde doğrudan D1'e bağlanır. Ücretsiz kademede
      // çağrı başına 10 ms CPU var; 2 MB'lık bir sesi ikinci kez kopyalamak
      // bu bütçeyi yakıyordu (error 1102).
      const buf = await request.arrayBuffer()
      if (buf.byteLength === 0) return reply({ error: 'empty' }, 400)
      if (buf.byteLength > 6_500_000) return reply({ error: 'too_large' }, 413)
      const duration = Number(request.headers.get('x-audio-duration') ?? 0) || null
      // Üretildiği "okuma tarifi" sürümü: hangi sesler bayat, hangiler güncel
      // bununla bilinir.
      const recipe = (request.headers.get('x-audio-recipe') ?? '').slice(0, 64) || null
      const existing = await findAudio(env, id)
      const targetDb = existing?.db ?? (await getWritableAudioDb(env))

      await targetDb.prepare(
        `INSERT INTO news_audio (article_id, data, type, duration, bytes, recipe)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(article_id) DO UPDATE SET data=excluded.data, type=excluded.type,
           duration=excluded.duration, bytes=excluded.bytes, recipe=excluded.recipe`,
      )
        .bind(id, buf, 'audio/mpeg', duration, buf.byteLength, recipe)
        .run()
      await env.DB.prepare('UPDATE news SET audio_id = ?, audio_duration = ? WHERE id = ?')
        .bind(id, duration, id)
        .run()
      // Haber kaydında da tutulur: bayat ses tespiti tek sorguda yapılır.
      await env.DB.prepare('UPDATE news SET audio_recipe = ? WHERE id = ?')
        .bind(recipe, id)
        .run()
      return reply({ ok: true, id, bytes: buf.byteLength, recipe })
    }

    /**
     * Depolama bakımı (yalnızca toplayıcı).
     *
     * Depolama üç D1 veritabanına bölünmüştür:
     *   DB        → haber metni, yorum, beğeni, analitik (yıllarca küçük kalır)
     *   DB_AUDIO  → ses dosyaları
     *   DB_IMAGES → görseller
     *
     * D1'in ÜCRETSİZ kademesinde tek veritabanı 500 MB, hesap toplamı 5 GB.
     * Medya ana veritabanında tutulduğunda 500 MB'lık tavan aşılınca D1 bütün
     * yazmaları reddediyordu ("Exceeded maximum DB size") ve haber toplama
     * tamamen duruyordu. Ayrı veritabanlarında ise kota dolunca yalnızca en
     * eski ses/görsel gider; HABER METNİ KALICI KALIR.
     *
     * Sabit "şu kadar gün sonra sil" kuralı yok: toplam boyut bütçeyi geçerse
     * en eskilerden başlanarak hedefe kadar silinir. Kota dolmadıkça hiçbir
     * şeye dokunulmaz.
     *
     * Emniyet tabanı: yeni üretilmiş sese (5 gün) ve yeni görsele (7 gün)
     * dokunulmaz. Ses silinen haber `audio_retired` ile işaretlenir ki bir
     * daha seslendirilmesin (silme ile üretim birbirini kovalamasın).
     *
     * Podcast: en yeni `podcastKeep` bölüm tutulur (besleme zaten 30 bölüm
     * listeliyor), daha eskileri silinir — aksi halde hiç silinmeyen tek
     * kalem olur ve kotayı yıllar içinde tek başına doldurur.
     *
     * Gövde (hepsi isteğe bağlı, MB cinsinden):
     *   { audioBudget, audioTarget, imageBudget, imageTarget,
     *     audioMinAgeDays, imageMinAgeDays, podcastKeep, dryRun }
     */
    if (url.pathname === '/api/storage/prune' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      if (!env.DB_AUDIO || !env.DB_IMAGES) return reply({ error: 'no_split_db' }, 500)
      const body = await request.json().catch(() => ({}))
      const dryRun = body?.dryRun === true
      const MB = 1024 * 1024
      const audioBudget = Number(body?.audioBudget ?? 480) * MB
      const audioTarget = Number(body?.audioTarget ?? 440) * MB
      const imageBudget = Number(body?.imageBudget ?? 480) * MB
      const imageTarget = Number(body?.imageTarget ?? 440) * MB
      // Eski çağrılar tek bir `minAgeDays` gönderiyordu; ikisine de uygulanır.
      const legacyAge =
        body?.minAgeDays === undefined ? null : Math.max(1, Number(body.minAgeDays))
      const audioAge = Math.max(1, Number(body?.audioMinAgeDays ?? legacyAge ?? 5))
      const imageAge = Math.max(1, Number(body?.imageMinAgeDays ?? legacyAge ?? 7))
      const podcastKeep = Math.max(1, Math.min(200, Number(body?.podcastKeep ?? 30)))

      const sizeOf = async (db, table) => {
        const r = await db
          .prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(data)), 0) AS b FROM ${table}`)
          .first()
        return { count: Number(r?.n ?? 0), bytes: Number(r?.b ?? 0) }
      }

      /** Kimlikleri 80'lik parçalar hâlinde tek sorguda siler (param sınırı 100). */
      const chunky = async (ids, sql, db) => {
        for (let i = 0; i < ids.length; i += 80) {
          const part = ids.slice(i, i + 80)
          await db.prepare(sql(part.length)).bind(...part).run()
        }
      }
      const marks = (n) => Array.from({ length: n }, () => '?').join(',')

      // ── Podcast: en yeni N bölüm kalır ───────────────────────────────────
      let podcastDeleted = 0
      let podcastFreed = 0
      {
        const { results } = await env.DB.prepare(
          `SELECT id, audio_id AS audioId FROM podcast_episodes
            ORDER BY published_at DESC LIMIT -1 OFFSET ?`,
        )
          .bind(podcastKeep)
          .all()
        const rows = results ?? []
        const audioIds = rows.map((r) => r.audioId).filter(Boolean)
        podcastDeleted = rows.length
        // Boyutlar ses veritabanından ayrıca toplanır (çapraz DB JOIN olmaz).
        for (let i = 0; i < audioIds.length; i += 80) {
          const part = audioIds.slice(i, i + 80)
          const s = await env.DB_AUDIO.prepare(
            `SELECT COALESCE(SUM(LENGTH(data)), 0) AS b FROM news_audio
              WHERE article_id IN (${marks(part.length)})`,
          )
            .bind(...part)
            .first()
          podcastFreed += Number(s?.b ?? 0)
        }
        if (!dryRun && rows.length > 0) {
          if (audioIds.length > 0) {
            await chunky(
              audioIds,
              (n) => `DELETE FROM news_audio WHERE article_id IN (${marks(n)})`,
              env.DB_AUDIO,
            )
          }
          await chunky(
            rows.map((r) => r.id),
            (n) => `DELETE FROM podcast_episodes WHERE id IN (${marks(n)})`,
            env.DB,
          )
        }
      }

      const audioDbs = getAudioDbs(env)
      const imageDbs = getImageDbs(env)

      // Tüm ses veritabanlarının boyutlarını topla
      const audioShards = []
      let totalAudioBytes = 0
      for (let i = 0; i < audioDbs.length; i++) {
        const s = await sizeOf(audioDbs[i], 'news_audio')
        audioShards.push({ shard: i + 1, db: audioDbs[i], ...s })
        totalAudioBytes += s.bytes
      }

      // Tüm görsel veritabanlarının boyutlarını topla
      const imageShards = []
      let totalImageBytes = 0
      for (let i = 0; i < imageDbs.length; i++) {
        const s = await sizeOf(imageDbs[i], 'images')
        imageShards.push({ shard: i + 1, db: imageDbs[i], ...s })
        totalImageBytes += s.bytes
      }

      // ── Sesler: YALNIZCA TÜM VERİTABANLARI DOLDUYSA SİLİNİR ───────────────
      // Kullanıcı kuralı: "biri dolunca diğer db den devam etsin, ancak tamamı dolarsa en eskiden başlayarak ses temizliği yapılsın"
      let audioDeleted = 0
      let audioFreed = 0
      // En az bir ses veritabanında boş yer varsa (audioTarget altında ise), yeni haberler oraya yazılabilir.
      // Yalnızca TÜM veritabanları dolduysa en eskiden silme başlar.
      const allAudioFull = audioShards.every((s) => s.bytes >= audioTarget)

      if (allAudioFull) {
        for (const shard of audioShards) {
          if (shard.bytes <= audioTarget) continue
          const { results } = await shard.db.prepare(
            `SELECT article_id AS id, LENGTH(data) AS b
               FROM news_audio
              WHERE article_id NOT LIKE 'zenpod-%'
                AND julianday(created_at) < julianday('now', ?)
              ORDER BY julianday(created_at) ASC
              LIMIT 500`,
          )
            .bind(`-${audioAge} days`)
            .all()

          const ids = []
          let remaining = shard.bytes
          for (const row of results ?? []) {
            if (remaining <= audioTarget) break
            ids.push(row.id)
            remaining -= Number(row.b ?? 0)
            audioFreed += Number(row.b ?? 0)
          }
          if (ids.length > 0) {
            audioDeleted += ids.length
            if (!dryRun) {
              await chunky(
                ids,
                (n) => `DELETE FROM news_audio WHERE article_id IN (${marks(n)})`,
                shard.db,
              )
              await chunky(
                ids,
                (n) =>
                  `UPDATE news SET audio_id = NULL, audio_duration = NULL, audio_retired = 1
                    WHERE id IN (${marks(n)})`,
                env.DB,
              )
            }
          }
          if (audioFreed > 0) break
        }
      }

      // ── Görseller: YALNIZCA TÜM GÖRSEL VERİTABANLARI DOLDUYSA SİLİNİR ─────
      let imageDeleted = 0
      let imageFreed = 0
      const allImagesFull = imageShards.every((s) => s.bytes >= imageTarget)

      if (allImagesFull) {
        for (const shard of imageShards) {
          if (shard.bytes <= imageTarget) continue
          const { results } = await shard.db.prepare(
            `SELECT key, LENGTH(data) AS b FROM images
              WHERE julianday(created_at) < julianday('now', ?)
              ORDER BY julianday(created_at) ASC
              LIMIT 500`,
          )
            .bind(`-${imageAge} days`)
            .all()

          const keys = []
          let remaining = shard.bytes
          for (const row of results ?? []) {
            if (remaining <= imageTarget) break
            keys.push(row.key)
            remaining -= Number(row.b ?? 0)
            imageFreed += Number(row.b ?? 0)
          }
          if (keys.length > 0) {
            imageDeleted += keys.length
            if (!dryRun) {
              await chunky(
                keys,
                (n) => `DELETE FROM images WHERE key IN (${marks(n)})`,
                shard.db,
              )
              await chunky(
                keys.map((k) => `/img/${k}`),
                (n) => `UPDATE news SET source_image = NULL WHERE source_image IN (${marks(n)})`,
                env.DB,
              )
            }
          }
          if (imageFreed > 0) break
        }
      }

      return reply({
        ok: true,
        dryRun,
        shards: {
          audio: audioShards.map((s) => ({ shard: s.shard, count: s.count, bytes: s.bytes })),
          images: imageShards.map((s) => ({ shard: s.shard, count: s.count, bytes: s.bytes })),
        },
        podcast: {
          keep: podcastKeep,
          deleted: podcastDeleted,
          freed: podcastFreed,
        },
        audio: {
          before: totalAudioBytes,
          after: totalAudioBytes - audioFreed,
          deleted: audioDeleted,
          freed: audioFreed,
        },
        images: {
          before: totalImageBytes,
          after: totalImageBytes - imageFreed,
          deleted: imageDeleted,
          freed: imageFreed,
        },
      })
    }

    // 10 Veritabanının canlı doluluk ve shard durumunu raporlar
    if (url.pathname === '/api/storage/status' && request.method === 'GET') {
      const audioDbs = getAudioDbs(env)
      const imageDbs = getImageDbs(env)
      const sizeOf = async (db, table) => {
        try {
          const r = await db.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(data)), 0) AS b FROM ${table}`).first()
          return { count: Number(r?.n ?? 0), bytes: Number(r?.b ?? 0) }
        } catch {
          return { count: 0, bytes: 0 }
        }
      }
      const audioShards = []
      let totalAudioBytes = 0
      let totalAudioCount = 0
      for (let i = 0; i < audioDbs.length; i++) {
        const s = await sizeOf(audioDbs[i], 'news_audio')
        audioShards.push({ shard: i + 1, count: s.count, bytes: s.bytes, mb: +(s.bytes / 1048576).toFixed(1), percent: +((s.bytes / (500 * 1048576)) * 100).toFixed(1) })
        totalAudioBytes += s.bytes
        totalAudioCount += s.count
      }
      const imageShards = []
      let totalImageBytes = 0
      let totalImageCount = 0
      for (let i = 0; i < imageDbs.length; i++) {
        const s = await sizeOf(imageDbs[i], 'images')
        imageShards.push({ shard: i + 1, count: s.count, bytes: s.bytes, mb: +(s.bytes / 1048576).toFixed(1), percent: +((s.bytes / (500 * 1048576)) * 100).toFixed(1) })
        totalImageBytes += s.bytes
        totalImageCount += s.count
      }
      const newsCount = (await env.DB.prepare('SELECT COUNT(*) AS c FROM news').first())?.c ?? 0
      return reply({
        totalDatabases: 1 + imageDbs.length + audioDbs.length,
        allocatedStorageMB: (1 + imageDbs.length + audioDbs.length) * 500,
        news: { count: newsCount },
        audio: {
          totalShards: audioDbs.length,
          totalCount: totalAudioCount,
          totalBytes: totalAudioBytes,
          totalMB: +(totalAudioBytes / 1048576).toFixed(1),
          shards: audioShards,
        },
        images: {
          totalShards: imageDbs.length,
          totalCount: totalImageCount,
          totalBytes: totalImageBytes,
          totalMB: +(totalImageBytes / 1048576).toFixed(1),
          shards: imageShards,
        },
      })
    }

    /**
     * Tek seferlik taşıma: medyayı ana veritabanından kendi veritabanına taşır.
     *
     * Depolama bölünmesi yapıldığında eski ses/görseller ana veritabanında
     * kalmıştı; bu uç onları partiler hâlinde taşır. Normal akışta çağrılmaz
     * (yalnızca geçiş sırasında). Taşınan satır ana veritabanından silinir,
     * böylece 500 MB'lık tavan hemen boşalır.
     */
    if (url.pathname === '/api/storage/move' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      if (!env.DB_AUDIO || !env.DB_IMAGES) return reply({ error: 'no_split_db' }, 500)
      const body = await request.json().catch(() => ({}))
      const kind = body?.kind === 'images' ? 'images' : 'audio'
      const limit = Math.max(1, Math.min(25, Number(body?.limit ?? 10)))
      const marks = (n) => Array.from({ length: n }, () => '?').join(',')
      const chunky = async (ids, sql) => {
        for (let i = 0; i < ids.length; i += 80) {
          const part = ids.slice(i, i + 80)
          await env.DB.prepare(sql(part.length)).bind(...part).run()
        }
      }
      // Ücretsiz kademede CPU 10 ms: BLOB'u gereksiz yere kopyalamıyoruz.
      // D1 zaten ArrayBuffer/typed array döndürüyorsa olduğu gibi bağlanır.
      const bindable = (v) =>
        v instanceof ArrayBuffer || ArrayBuffer.isView(v) ? v : toBytes(v)

      if (kind === 'images') {
        const { results } = await env.DB.prepare(
          `SELECT key, data, type, bytes, created_at FROM images
            ORDER BY created_at ASC LIMIT ?`,
        )
          .bind(limit)
          .all()
        const rows = results ?? []
        if (rows.length > 0) {
          await env.DB_IMAGES.batch(
            rows.map((r) =>
              env.DB_IMAGES
                .prepare(
                  `INSERT OR REPLACE INTO images (key, data, type, bytes, created_at)
                   VALUES (?,?,?,?,?)`,
                )
                .bind(r.key, bindable(r.data), r.type, r.bytes, r.created_at),
            ),
          )
          await chunky(rows.map((r) => r.key), (n) => `DELETE FROM images WHERE key IN (${marks(n)})`)
        }
        const left = await env.DB.prepare('SELECT COUNT(*) AS n FROM images').first()
        return reply({ ok: true, kind, moved: rows.length, remaining: Number(left?.n ?? 0) })
      }

      const { results } = await env.DB.prepare(
        `SELECT article_id, data, type, duration, bytes, created_at, recipe FROM news_audio
          ORDER BY created_at ASC LIMIT ?`,
      )
        .bind(limit)
        .all()
      const rows = results ?? []
      if (rows.length > 0) {
        await env.DB_AUDIO.batch(
          rows.map((r) =>
            env.DB_AUDIO
              .prepare(
                `INSERT OR REPLACE INTO news_audio
                   (article_id, data, type, duration, bytes, created_at, recipe)
                 VALUES (?,?,?,?,?,?,?)`,
              )
              .bind(
                r.article_id,
                bindable(r.data),
                r.type,
                r.duration,
                r.bytes,
                r.created_at,
                r.recipe,
              ),
          ),
        )
        await chunky(
          rows.map((r) => r.article_id),
          (n) => `DELETE FROM news_audio WHERE article_id IN (${marks(n)})`,
        )
      }
      const left = await env.DB.prepare('SELECT COUNT(*) AS n FROM news_audio').first()
      return reply({ ok: true, kind, moved: rows.length, remaining: Number(left?.n ?? 0) })
    }

    /**
     * Tek seferlik taşıma: sesi tek ifadede, oluşturma zamanı korunarak yazar.
     *
     * `/api/storage/move` kaynak BLOB'u D1'den okuyup yeniden yazdığı için
     * 2 MB üstü seslerde ücretsiz kademenin 10 ms CPU bütçesini aşıyor
     * (error 1102). Burada gövde doğrudan yazılır; ses dosyası yerelden gelir.
     * Normal akışta kullanılmaz.
     */
    if (url.pathname === '/api/storage/put' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const id = url.searchParams.get('id') ?? ''
      if (!id || id.length > 120) return reply({ error: 'invalid_id' }, 400)
      const buf = await request.arrayBuffer()
      if (buf.byteLength === 0) return reply({ error: 'empty' }, 400)
      const duration = Number(request.headers.get('x-audio-duration') ?? 0) || null
      const recipe = (request.headers.get('x-audio-recipe') ?? '').slice(0, 64) || null
      const createdAt = (request.headers.get('x-audio-created') ?? '').slice(0, 32) || null

      const existing = await findAudio(env, id)
      const targetDb = existing?.db ?? (await getWritableAudioDb(env))

      await targetDb.prepare(
        `INSERT INTO news_audio (article_id, data, type, duration, bytes, created_at, recipe)
         VALUES (?,?,'audio/mpeg',?,?,COALESCE(?, datetime('now')),?)
         ON CONFLICT(article_id) DO UPDATE SET data=excluded.data, type=excluded.type,
           duration=excluded.duration, bytes=excluded.bytes, recipe=excluded.recipe,
           created_at=COALESCE(?, news_audio.created_at)`,
      )
        .bind(id, buf, duration, buf.byteLength, createdAt, recipe, createdAt)
        .run()
      await env.DB.prepare(
        'UPDATE news SET audio_id = ?, audio_duration = ?, audio_recipe = ? WHERE id = ?',
      )
        .bind(id, duration, recipe, id)
        .run()
      return reply({ ok: true, id, bytes: buf.byteLength })
    }

    /**
     * Tek seferlik taşıma: görseli tek ifadede, oluşturma zamanı korunarak yazar.
     * Ses ile aynı gerekçe (bkz. /api/storage/put). Normal akışta kullanılmaz.
     */
    if (url.pathname === '/api/storage/put-image' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      if (!env.DB_IMAGES) return reply({ error: 'no_split_db' }, 500)
      const key = url.searchParams.get('key') ?? ''
      if (!key || key.length > 200) return reply({ error: 'invalid_key' }, 400)
      const buf = await request.arrayBuffer()
      if (buf.byteLength === 0) return reply({ error: 'empty' }, 400)
      const type = (request.headers.get('x-image-type') ?? 'image/jpeg').slice(0, 40)
      const createdAt = (request.headers.get('x-image-created') ?? '').slice(0, 32) || null
      await env.DB_IMAGES.prepare(
        `INSERT INTO images (key, data, type, bytes, created_at)
         VALUES (?,?,?,?,COALESCE(?, datetime('now')))
         ON CONFLICT(key) DO UPDATE SET data=excluded.data, type=excluded.type,
           bytes=excluded.bytes, created_at=COALESCE(?, images.created_at)`,
      )
        .bind(key, buf, type, buf.byteLength, createdAt, createdAt)
        .run()
      return reply({ ok: true, key, bytes: buf.byteLength })
    }

    if (url.pathname.startsWith('/img/')) {
      const cache = caches.default
      const cacheKey = new Request(url.toString(), request)
      const cached = await cache.match(cacheKey)
      if (cached) return cached

      const key = decodeURIComponent(url.pathname.slice('/img/'.length))
      const row = await env.DB_IMAGES?.prepare('SELECT data, type FROM images WHERE key = ?')
        .bind(key)
        .first()
      const bytes = toBytes(row?.data)
      if (!bytes) return new Response('Not found', { status: 404 })
      const res = new Response(bytes, {
        headers: {
          'content-type': row?.type ?? 'image/jpeg',
          'cache-control': 'public, max-age=31536000, immutable',
          ...cors,
        },
      })
      ctx?.waitUntil?.(cache.put(cacheKey, res.clone()))
      return res
    }

    // Görsel yükleme (yalnızca toplayıcı)
    if (url.pathname === '/api/image' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const key = url.searchParams.get('key') ?? ''
      if (!/^[\w.-]{1,120}$/.test(key)) return reply({ error: 'invalid_key' }, 400)
      const type = request.headers.get('content-type') ?? 'image/jpeg'
      const data = new Uint8Array(await request.arrayBuffer())
      if (data.length === 0) return reply({ error: 'empty' }, 400)
      if (data.length > 2_000_000) return reply({ error: 'too_large' }, 413)

      await env.DB_IMAGES.prepare(
        `INSERT INTO images (key, data, type, bytes) VALUES (?,?,?,?)
         ON CONFLICT(key) DO UPDATE SET data=excluded.data, type=excluded.type, bytes=excluded.bytes`,
      )
        .bind(key, data, type, data.length)
        .run()
      return reply({ ok: true, key, bytes: data.length })
    }

    // --- Etkileşim: beğeni, kaydetme, yorum (gerçek kullanıcı verisi) ---

    if (url.pathname === '/api/engagement' && request.method === 'GET') {
      const article = url.searchParams.get('article') ?? ''
      const user = await currentUser(request, env)
      if (!article) return reply({ error: 'missing_article' }, 400)

      const [likes, bookmarks, comments] = await Promise.all([
        env.DB.prepare('SELECT article_id FROM news_likes WHERE article_id = ?').bind(article).all(),
        env.DB.prepare('SELECT article_id FROM news_bookmarks WHERE article_id = ?').bind(article).all(),
        env.DB.prepare(
          'SELECT id, article_id, user_id, author_name, body, parent_id, likes, created_at FROM news_comments WHERE article_id = ? ORDER BY created_at ASC LIMIT 300',
        ).bind(article).all(),
      ])

      const myLikes = new Set(
        user
          ? (
              await env.DB.prepare('SELECT article_id FROM news_likes WHERE user_id = ?').bind(user.id).all()
            ).results.map((r) => r.article_id)
          : [],
      )
      const myBookmarks = new Set(
        user
          ? (
              await env.DB.prepare('SELECT article_id FROM news_bookmarks WHERE user_id = ?').bind(user.id).all()
            ).results.map((r) => r.article_id)
          : [],
      )

      const myCommentLikes = user
        ? (
            await env.DB.prepare(
              'SELECT comment_id FROM news_comment_likes WHERE user_id = ? AND comment_id IN (SELECT id FROM news_comments WHERE article_id = ?)',
            )
              .bind(user.id, article)
              .all()
          ).results.map((r) => r.comment_id)
        : []

      return reply({
        likes: likes.results.length,
        bookmarks: bookmarks.results.length,
        myLikes: [...myLikes],
        myBookmarks: [...myBookmarks],
        myCommentLikes,
        comments: comments.results.map((c) => ({
          id: c.id,
          articleId: c.article_id,
          authorId: c.user_id,
          authorName: c.author_name,
          body: c.body,
          parentId: c.parent_id ?? null,
          likes: c.likes,
          createdAt: c.created_at,
        })),
      })
    }

    // Gerçek görüntülenme sayacı: haber sayfası açıldığça bir kez artar.
    if (url.pathname === '/api/view' && request.method === 'POST') {
      const { article } = await request.json().catch(() => ({}))
      if (!article) return reply({ error: 'missing_article' }, 400)
      await env.DB.prepare('UPDATE news SET views = views + 1 WHERE id = ?').bind(article).run()
      const row = await env.DB.prepare('SELECT views FROM news WHERE id = ?').bind(article).first()
      return reply({ ok: true, views: row?.views ?? 0 })
    }

    if (url.pathname === '/api/like' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { article, on } = await request.json().catch(() => ({}))
      if (!article) return reply({ error: 'missing_article' }, 400)
      if (on) {
        await env.DB.prepare('INSERT OR IGNORE INTO news_likes (article_id, user_id) VALUES (?,?)')
          .bind(article, user.id)
          .run()
      } else {
        await env.DB.prepare('DELETE FROM news_likes WHERE article_id = ? AND user_id = ?')
          .bind(article, user.id)
          .run()
      }
      const { results } = await env.DB.prepare('SELECT COUNT(*) AS n FROM news_likes WHERE article_id = ?')
        .bind(article)
        .all()
      const likes = results[0]?.n ?? 0
      // Haber kaydındaki sayaç da güncel kalsın (sıralama ve listeler için).
      await env.DB.prepare('UPDATE news SET likes = ? WHERE id = ?').bind(likes, article).run()
      return reply({ ok: true, likes, liked: Boolean(on) })
    }

    if (url.pathname === '/api/bookmark' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { article, on } = await request.json().catch(() => ({}))
      if (!article) return reply({ error: 'missing_article' }, 400)
      if (on) {
        await env.DB.prepare('INSERT OR IGNORE INTO news_bookmarks (article_id, user_id) VALUES (?,?)')
          .bind(article, user.id)
          .run()
      } else {
        await env.DB.prepare('DELETE FROM news_bookmarks WHERE article_id = ? AND user_id = ?')
          .bind(article, user.id)
          .run()
      }
      return reply({ ok: true, bookmarked: Boolean(on) })
    }

    if (url.pathname === '/api/comment' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { article, body, parentId } = await request.json().catch(() => ({}))
      const text = String(body ?? '').trim()
      if (!article || !text) return reply({ error: 'missing_fields' }, 400)
      if (text.length > 1000) return reply({ error: 'too_long' }, 413)
      const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      await env.DB.prepare(
        'INSERT INTO news_comments (id, article_id, user_id, author_name, body, parent_id) VALUES (?,?,?,?,?,?)',
      )
        .bind(id, article, user.id, user.name, text, parentId ?? null)
        .run()
      return reply({
        ok: true,
        comment: {
          id,
          articleId: article,
          authorId: user.id,
          authorName: user.name,
          body: text,
          parentId: parentId ?? null,
          likes: 0,
          createdAt: new Date().toISOString(),
        },
      })
    }

    if (url.pathname === '/api/comment-like' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { comment, on } = await request.json().catch(() => ({}))
      if (!comment) return reply({ error: 'missing_comment' }, 400)
      if (on) {
        await env.DB.prepare('INSERT OR IGNORE INTO news_comment_likes (comment_id, user_id) VALUES (?,?)')
          .bind(comment, user.id)
          .run()
      } else {
        await env.DB.prepare('DELETE FROM news_comment_likes WHERE comment_id = ? AND user_id = ?')
          .bind(comment, user.id)
          .run()
      }
      // Sayaç gerçek beğeni kayıtlarından yeniden hesaplanır.
      const { results } = await env.DB.prepare(
        'SELECT COUNT(*) AS n FROM news_comment_likes WHERE comment_id = ?',
      )
        .bind(comment)
        .all()
      const likes = results?.[0]?.n ?? 0
      await env.DB.prepare('UPDATE news_comments SET likes = ? WHERE id = ?').bind(likes, comment).run()
      return reply({ ok: true, likes, liked: Boolean(on) })
    }

    /* ── Günlük e-Gazeteler & Manşetler ─────────────────────────────────── */
    if (url.pathname === '/api/gazeteler' && request.method === 'GET') {
      const data = await getGazeteler(env)
      return reply(data, 200, {
        'cache-control': 'public, max-age=900, stale-while-revalidate=1800',
      })
    }

    /* ── ZEN Asistan ────────────────────────────────────────────────────── */
    if (url.pathname === '/api/assistant/history' && request.method === 'GET') {
      const user = await currentUser(request, env)
      const userId = user
        ? user.id
        : 'guest_' + (request.headers.get('cf-connecting-ip') || 'anon').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)
      const [messages, quota] = await Promise.all([
        listMessages(env, userId),
        quotaOf(env, userId),
      ])
      return reply({ messages, quota })
    }

    if (url.pathname === '/api/assistant' && request.method === 'POST') {
      try {
        const user = await currentUser(request, env)
        const userId = user
          ? user.id
          : 'guest_' + (request.headers.get('cf-connecting-ip') || 'anon').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)
        const payload = await request.json().catch(() => ({}))
        const question = String(payload?.question ?? '').trim()
        if (!question) return reply({ error: 'missing_question' }, 400)

        const quota = await quotaOf(env, userId)
        if (quota.remaining <= 0) return reply({ error: 'quota', quota }, 429)

        const history = await listMessages(env, userId)
        const archive = await searchNews(env, question)
        const result = await answer(env, question, history, archive)
        if (!result.text) {
          console.error('[assistant] yanit alinamadi:', String(result.error ?? '').slice(0, 160))
          return reply({ error: 'model_hatasi' }, 502)
        }
        await bumpQuota(env, userId)
        await saveMessage(env, userId, 'user', question)
        await saveMessage(env, userId, 'assistant', result.text, result.sources)
        const after = await quotaOf(env, userId)
        return reply({ text: result.text, sources: result.sources, quota: after })
      } catch (err) {
        console.error('[assistant error]', err)
        return reply({ error: String(err?.message ?? err), stack: String(err?.stack ?? '') }, 500)
      }
    }

    /* ── Sistem durumu (operatör için; ziyaretçi arayüzüne dokunmaz) ── */
    if (url.pathname === '/api/state/audio' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const payload = await request.json().catch(() => ({}))
      await recordState(env, 'audio', payload)
      return reply({ ok: true })
    }

    // Gerçek görüntülenme sayacı — çerezsiz, kimlik tutmaz.
    if (url.pathname === '/api/track/stats' && request.method === 'GET') {
      const days = Math.min(Number(url.searchParams.get('days') ?? 14), 90)
      const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM page_views').first()
      const recent = await env.DB.prepare(
        `SELECT day, SUM(count) AS n FROM page_views
         WHERE day >= date('now', ?) GROUP BY day ORDER BY day ASC`,
      )
        .bind(`-${days} days`)
        .all()
      const top = await env.DB.prepare(
        `SELECT path, SUM(count) AS n FROM page_views
         WHERE day >= date('now', '-30 days') GROUP BY path ORDER BY n DESC LIMIT 25`,
      ).all()
      return reply({
        ok: true,
        total: total?.n ?? 0,
        days: recent?.results ?? [],
        top: top?.results ?? [],
      })
    }

    /* ── Kullanıcı ilgi alanları ("Sana Özel" akışı) ─────────────────── */
    if (url.pathname === '/api/interest' && request.method === 'GET') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const rows = await env.DB.prepare(
        'SELECT kind, value, weight FROM user_interests WHERE user_id = ? ORDER BY weight DESC LIMIT 60',
      )
        .bind(user.id)
        .all()
      return reply({ interests: rows?.results ?? [] })
    }

    if (url.pathname === '/api/interest' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { kind, value, delta } = await request.json().catch(() => ({}))
      const k = String(kind ?? '').slice(0, 20)
      const v = String(value ?? '').slice(0, 80)
      if (!k || !v) return reply({ error: 'missing_fields' }, 400)
      const d = Math.max(-1, Math.min(1, Number(delta ?? 1)))
      await env.DB.prepare(
        `INSERT INTO user_interests (user_id, kind, value, weight, updated_at)
         VALUES (?,?,?,?, datetime('now'))
         ON CONFLICT(user_id, kind, value) DO UPDATE SET
           weight = MAX(-5, MIN(5, user_interests.weight + ?)),
           updated_at = datetime('now')`,
      )
        .bind(user.id, k, v, d, d)
        .run()
      return reply({ ok: true })
    }

    /* ── Web push ────────────────────────────────────────────────────── */
    if (url.pathname === '/api/push/key' && request.method === 'GET') {
      return reply({ ok: true, publicKey: env.VAPID_PUBLIC_KEY ?? '' })
    }

    if (url.pathname === '/api/push/subscribe' && request.method === 'POST') {
      const user = await currentUser(request, env)
      const { endpoint, keys, categories } = await request.json().catch(() => ({}))
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return reply({ error: 'missing_fields' }, 400)
      }
      const id = `p_${hashString(endpoint).slice(0, 16)}`
      await env.DB.prepare(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, categories)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth,
           categories=excluded.categories`,
      )
        .bind(
          id,
          user?.id ?? null,
          String(endpoint).slice(0, 500),
          String(keys.p256dh).slice(0, 200),
          String(keys.auth).slice(0, 100),
          JSON.stringify(Array.isArray(categories) ? categories.slice(0, 12) : []).slice(0, 300),
        )
        .run()
      return reply({ ok: true, id })
    }

    if (url.pathname === '/api/push/unsubscribe' && request.method === 'POST') {
      const { endpoint } = await request.json().catch(() => ({}))
      if (!endpoint) return reply({ error: 'missing_fields' }, 400)
      await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')
        .bind(String(endpoint).slice(0, 500))
        .run()
      return reply({ ok: true })
    }

    // Abone listesi ve VAPID bilgisi yalnızca toplayıcı (CI) için.
    if (url.pathname === '/api/push/subscribers' && request.method === 'GET') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const rows = await env.DB.prepare(
        'SELECT endpoint, p256dh, auth, categories FROM push_subscriptions',
      ).all()
      return reply({
        ok: true,
        publicKey: env.VAPID_PUBLIC_KEY ?? '',
        privateKey: env.VAPID_PRIVATE_KEY ?? '',
        subscribers: (rows?.results ?? []).map((r) => ({
          endpoint: r.endpoint,
          keys: { p256dh: r.p256dh, auth: r.auth },
          categories: r.categories ? JSON.parse(r.categories) : [],
        })),
      })
    }

    /* ── ZENPOD Eğitim bölümleri ────────────────────────────────────── */
    if (url.pathname === '/api/podcast/episode' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const { id, title, description, duration } = await request.json().catch(() => ({}))
      if (!id || !title) return reply({ error: 'missing_fields' }, 400)
      await env.DB.prepare(
        `INSERT INTO podcast_episodes (id, title, description, audio_id, duration)
         VALUES (?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description,
           audio_id=excluded.audio_id, duration=excluded.duration`,
      )
        .bind(
          String(id).slice(0, 80),
          String(title).slice(0, 200),
          String(description ?? '').slice(0, 2000),
          String(id).slice(0, 80),
          Number(duration ?? 0) || null,
        )
        .run()
      return reply({ ok: true, id })
    }

    if (url.pathname === '/api/podcast/episodes' && request.method === 'GET') {
      const rows = await env.DB.prepare(
        'SELECT id, title, description, duration, published_at FROM podcast_episodes ORDER BY published_at DESC LIMIT 30',
      ).all()
      return reply({ episodes: rows?.results ?? [] })
    }

    // Geriye dönük metin doldurma: eski haberlerin kısa gövdesi kaynak
    // sayfadan yeniden çekilip tam metinle değiştirilir.
    if (url.pathname === '/api/refill' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const payload = await request.json().catch(() => ({}))
      const items = Array.isArray(payload?.items) ? payload.items : []
      if (items.length === 0) return reply({ ok: true, updated: 0 })
      let updated = 0
      for (const it of items.slice(0, 100)) {
        const body = Array.isArray(it.body) ? it.body.filter((p) => typeof p === 'string') : []
        if (!it.slug || body.length === 0) continue
        const res = await env.DB.prepare(
          'UPDATE news SET body = ?, full_text = ?, excerpt = COALESCE(?, excerpt) WHERE slug = ?',
        )
          .bind(JSON.stringify(body), body.length >= 2 ? 1 : 0, it.excerpt ?? null, it.slug)
          .run()
        updated += res?.meta?.changes ?? 0
      }
      return reply({ ok: true, updated })
    }

    // Tetikleme testi / elle tetikleme (COLLECT_SECRET korumalı)
    if (url.pathname === '/api/trigger' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const result = await dispatchCollect(env)
      return reply(result, result.ok ? 200 : 502)
    }

    if (url.pathname === '/api/news') {
      const includeBody = url.searchParams.get('include_body') === '1' || url.searchParams.get('full') === '1'
      const reqLimit = Math.min(Number(url.searchParams.get('limit') ?? 1000), 2000)
      const items = await store(env).all(reqLimit, includeBody)
      return reply(
        { items, count: items.length },
        200,
        { 'cache-control': includeBody ? 'no-store' : 'public, max-age=120, stale-while-revalidate=900' },
      )
    }

    if (url.pathname.startsWith('/api/news/')) {
      const slug = decodeURIComponent(url.pathname.slice('/api/news/'.length))
      const row = await store(env).bySlug(slug)
      if (!row) return reply({ error: 'not_found' }, 404)
      return reply(row, 200, { 'cache-control': 'public, max-age=300' })
    }

    // GitHub Actions topladığı haberleri buraya gönderir.
    if (url.pathname === '/api/collect' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      let payload
      try {
        payload = await request.json()
      } catch {
        return reply({ error: 'invalid_json' }, 400)
      }
      const items = Array.isArray(payload?.items) ? payload.items : []
      if (items.length === 0) return reply({ ok: true, inserted: 0, skipped: 0 })

      // D1 tek seferde en fazla 100 bağlı ifade kabul eder.
      const CHUNK = 50
      let inserted = 0
      let skipped = 0
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK)
        const result = await store(env).upsert(chunk)
        inserted += result.inserted
        skipped += result.skipped
      }
      console.log(`[worker] ${inserted} yeni, ${skipped} tekrar`)
      await recordState(env, 'collect', {
        ok: true,
        inserted,
        skipped,
        at: new Date().toISOString(),
      })
      return reply({ ok: true, inserted, skipped })
    }

    if (url.pathname === '/api/health') {
      const news = await env.DB?.prepare('SELECT COUNT(*) AS n FROM news').all()
      const audioDbs = getAudioDbs(env)
      const imageDbs = getImageDbs(env)
      let totalAudioCount = 0
      for (const db of audioDbs) {
        try {
          const r = await db.prepare('SELECT COUNT(*) AS n FROM news_audio').first()
          totalAudioCount += Number(r?.n ?? 0)
        } catch {}
      }
      let totalImageCount = 0
      for (const db of imageDbs) {
        try {
          const r = await db.prepare('SELECT COUNT(*) AS n FROM images').first()
          totalImageCount += Number(r?.n ?? 0)
        } catch {}
      }
      const dispatch = await readState(env, 'dispatch')
      const collect = await readState(env, 'collect')
      // Ses üretim durumu operatör içindir; ziyaretçi arayüzü göstermez.
      const audio = await readState(env, 'audio')
      return reply({
        ok: true,
        news: news?.results?.[0]?.n ?? 0,
        images: totalImageCount,
        audioFiles: totalAudioCount,
        databases: {
          audioShards: audioDbs.length,
          imageShards: imageDbs.length,
        },
        // Otomasyon durumu: erişim anahtarı bozulursa site bunu gösterir.
        automation: { dispatch, collect },
        // Ses üretim durumu operatör içindir (ziyaretçi arayüzü göstermez).
        audio,
        time: new Date().toISOString(),
      })
    }

    return reply({ error: 'not_found' }, 404)
  },
}

export { fromRow }
