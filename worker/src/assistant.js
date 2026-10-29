/**
 * ZEN Asistan — kullanıcı sorularını yanıtlayan ucuz model + web araması.
 *
 * Kurallar:
 *  · Yalnızca giriş yapmış kullanıcılar kullanabilir.
 *  · Günlük kota (kullanıcı başına) D1'de tutulur.
 *  · Sohbet geçmişi D1'de saklanır; panel yeniden açıldığında mesajlar geri gelir.
 *  · Ucuz model (flash-lite) tercih edilir; gerekirse model zincirinde yukarı çıkılır.
 */

const ENDPOINT = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

/** Ucuzdan pahalıya hızlı model zinciri (flash-lite modelleri öncelikli). */
export const ASSISTANT_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
]

export const ASSISTANT_DAILY_QUOTA = 20

const SYSTEM = `Sen "ZEN Eğitim Asistanı"sin. Türkiye eğitim basınının editörü gibi konuşursun.

GÖREV:
- Kullanıcının sorusuna Türkçe, net, samimi ve doğrudan yanıt ver.
- Önce sana verilen HABER ARŞİVİ'ni kullan: soruyla ilgili kayıtları bul, onlardan özetle ve haber başlıklarına [Haber Başlığı](/haber/slug-adresi) biçiminde tıklanabilir iç link ver.
- Güncel bilgi gerekiyorsa güncel kaynaklara dayan.
- Arşivde ve kaynaklarda olmayan bilgiyi uydurma.
- Yanıt en fazla 3-4 paragraf olsun; gerekiyorsa maddeler halinde yaz.
- Cevabın sonunda "Kaynaklar:" başlığı altında kullandığın haberleri yaz.
- Ton: sakin, profesyonel, editoryal Türkçe dil.`

/** Anahtarları ortam değişkeninden ve D1 veritabanından toplar, karıştırarak yükü dengeler */
async function getKeys(env) {
  const fromEnv = String(env.GEMINI_API_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k && !k.startsWith('AIzaSyDdF-cEVH'))

  let fromDb = []
  try {
    const row = await env.DB?.prepare("SELECT value FROM system_settings WHERE key = 'gemini_keys'").first()
    if (row?.value) {
      fromDb = String(row.value).split(',').map((k) => k.trim()).filter(Boolean)
    }
  } catch {}

  const all = Array.from(new Set([...fromEnv, ...fromDb])).filter(Boolean)

  // Rastgele karıştır (Fisher-Yates) — istekleri anahtarlar arasında dengeli dağıtır
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}

/** Bugünün gün anahtarı (UTC). */
function today() {
  return new Date().toISOString().slice(0, 10)
}

/** Kullanıcının bugünkü soru sayısı. */
export async function quotaOf(env, userId) {
  try {
    const row = await env.DB.prepare('SELECT count FROM assistant_usage WHERE user_id = ? AND day = ?')
      .bind(userId, today())
      .first()
    const used = row?.count ?? 0
    return { used, limit: ASSISTANT_DAILY_QUOTA, remaining: Math.max(0, ASSISTANT_DAILY_QUOTA - used) }
  } catch {
    return { used: 0, limit: ASSISTANT_DAILY_QUOTA, remaining: ASSISTANT_DAILY_QUOTA }
  }
}

async function bumpQuota(env, userId) {
  try {
    await env.DB.prepare(
      `INSERT INTO assistant_usage (user_id, day, count) VALUES (?,?,1)
       ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1`,
    )
      .bind(userId, today())
      .run()
  } catch (err) {
    console.error('[assistant] kota yazilamadi', String(err?.message ?? err).slice(0, 100))
  }
}

/** Sohbet geçmişini okur (en eski -> en yeni). */
export async function listMessages(env, userId, limit = 40) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, role, text, sources, created_at FROM assistant_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    )
      .bind(userId, limit)
      .all()
    return (results ?? [])
      .map((r) => ({
        id: r.id,
        role: r.role,
        text: r.text,
        sources: r.sources ? JSON.parse(r.sources) : [],
        createdAt: r.created_at,
      }))
      .reverse()
  } catch {
    return []
  }
}

/** Bir mesajı saklar. */
export async function saveMessage(env, userId, role, text, sources = []) {
  try {
    await env.DB.prepare(
      'INSERT INTO assistant_messages (id, user_id, role, text, sources) VALUES (?,?,?,?,?)',
    )
      .bind(
        `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        role,
        String(text ?? '').slice(0, 8000),
        JSON.stringify(sources ?? []).slice(0, 4000),
      )
      .run()
  } catch (err) {
    console.error('[assistant] mesaj yazilamadi', String(err?.message ?? err).slice(0, 100))
  }
}

/** Geçmişten son birkaç turu modele verir. */
function buildContents(history, question) {
  const contents = []
  for (const m of history.slice(-8)) {
    if (!m?.text) continue
    contents.push({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text).slice(0, 2000) }],
    })
  }
  contents.push({ role: 'user', parts: [{ text: String(question).slice(0, 1000) }] })
  // Gemini, içeriğin 'user' ile başlamasını ister.
  if (contents[0]?.role === 'model') contents.shift()
  return contents
}

/** Türkçe karakterleri indirger; arşivde arama için kullanılır. */
function fold(s = '') {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c])
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Sitede yayımlanmış haberlerden soruyla ilgili kayıtları bulur.
 * Web araması ücretsiz kademede kapalı olabildiği için asistanın bilgi
 * kaynağı bu arşivdir.
 */
export async function searchNews(env, question, limit = 8) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, excerpt, category, source_name, published_at
       FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT 800`,
    ).all()
    const terms = fold(question)
      .split(' ')
      .filter((w) => w.length > 2)
      .slice(0, 12)
    if (!terms.length) return results.slice(0, limit).map(toSource)
    const scored = results
      .map((r) => {
        const text = fold(`${r.title} ${r.excerpt ?? ''}`)
        let score = 0
        for (const t of terms) if (text.includes(t)) score += 1
        if (score > 0) score += 2
        return { r, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    return (scored.length ? scored : results.slice(0, limit)).map((x) => toSource(x.r ?? x))
  } catch {
    return []
  }
}

function toSource(r) {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category,
    source: r.source_name,
    publishedAt: r.published_at,
  }
}

/** Arşiv bağlamını modele verilecek metne çevirir. */
function archiveContext(list) {
  if (!list.length) return ''
  const lines = list.map(
    (n, i) =>
      `${i + 1}. ${n.title}\n   Kategori: ${n.category} · Kaynak: ${n.source}\n   Özet: ${String(n.excerpt ?? '').slice(0, 320)}`,
  )
  return `HABER ARŞİVİ (sitede yayımlanan gerçek haberler):\n${lines.join('\n')}\n\n`
}

/**
 * Soruyu yanıtlar.
 *
 * Önce doğrudan haber arşivine dayalı (RAG) hızlı ve güvenilir yanıt denenir.
 * Model veya kota sorunu olsa dahi haber arşivinden derleme ile kullanıcıya
 * kesintisiz bilgi ulaştırılır.
 *
 * @returns {Promise<{text:string, sources:Array, error?:string}>}
 */
export async function answer(env, question, history = [], archive = []) {
  const list = await getKeys(env)
  const context = archiveContext(archive)
  const questionText = context ? `${context}SORU: ${question}` : question

  // 1) Eğer API anahtarı varsa Gemini ile yanıt üretmeyi dene
  if (list.length > 0) {
    let lastError = 'bilinmeyen_hata'

    for (const model of ASSISTANT_MODELS) {
      for (const key of list) {
        try {
          const payload = {
            systemInstruction: { parts: [{ text: SYSTEM }] },
            contents: buildContents(history, questionText),
            generationConfig: { temperature: 0.35, maxOutputTokens: 2048 },
          }

          const res = await fetch(ENDPOINT(model, key), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (!res.ok) {
            const detail = (await res.text()).slice(0, 140)
            lastError = `model_${model}: ${detail}`
            // Kota dolduysa veya hata aldıysa sonraki anahtarı veya modeli dene
            continue
          }

          const json = await res.json()
          const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ?? ''
          if (!part) continue

          const sources = archive.slice(0, 6).map((n) => ({ type: 'news', slug: n.slug, title: n.title }))
          return { text: part.trim(), sources }
        } catch (err) {
          lastError = String(err?.message ?? err).slice(0, 140)
        }
      }
    }
    console.warn('[assistant] Gemini modelleri yanit veremedi, arsiv RAG devreye giriyor:', lastError)
  }

  // 2) Eğer API erişilemezse veya tüm kotalar dolduysa ARŞİVDEN DOĞRUDAN BİLGİ GETİR (Kesintisiz Çalışma)
  if (archive && archive.length > 0) {
    const listHtml = archive
      .slice(0, 4)
      .map(
        (a) =>
          `📌 **[${a.title}](/haber/${a.slug})**\n${a.excerpt ? a.excerpt.slice(0, 200) + '…' : ''}`,
      )
      .join('\n\n')

    return {
      text: `Sorunuzla ilgili haber arşivimizden en uygun sonuçları getirdim:\n\n${listHtml}\n\nİlgili haberin detaylarını okumak için başlıklara tıklayabilirsiniz.`,
      sources: archive.slice(0, 4).map((n) => ({ type: 'news', slug: n.slug, title: n.title })),
    }
  }

  return {
    text: 'Sorunuzla ilgili arşivimizde henüz doğrudan bir haber kaydı bulunamadı. Dilerseniz sorunuzu farklı anahtar kelimelerle (örneğin "MESEM", "atama", "burs") aramayı deneyebilirsiniz.',
    sources: [],
  }
}
