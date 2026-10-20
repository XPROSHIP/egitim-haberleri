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

/** Ucuzdan pahalıya model zinciri. */
export const ASSISTANT_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
]

export const ASSISTANT_DAILY_QUOTA = 20

const SYSTEM = `Sen "ZEN Eğitim Asistanı"sin. Türkiye eğitim basınının editörü gibi konuşursun.

GÖREV:
- Kullanıcının sorusuna Türkçe, kısa ve doğrudan yanıt ver.
- Önce sana verilen HABER ARŞİVİ'ni kullan: soruyla ilgili kayıtları bul ve onlardan özetle.
- Güncel bilgi gerekiyorsa ve web araması kullanılabiliyorsa güncel kaynaklara dayan.
- Arşivde ve kaynaklarda olmayan bilgiyi uydurma. Emin değilsen "kaynaklarda doğrulanamadı" de.
- Yanıt en fazla 3-4 paragraf olsun; gerekiyorsa kısa maddeler halinde yaz.
- Cevabın sonunda "Kaynaklar:" başlığı altında kullandığın haberlerin başlıklarını yaz.
- Ton: sakin, profesyonel, günlük dil. Emoji kullanma.`

function keys(env) {
  return String(env.GEMINI_API_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
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
export async function searchNews(env, question, limit = 6) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, excerpt, category, source_name, published_at
       FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT 300`,
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
 * Önce web araması (grounding) denenir; ücretsiz kademede bu araç kapalıysa
 * (429) sitedeki haber arşivine dayanarak cevap üretilir.
 *
 * @returns {Promise<{text:string, sources:Array, error?:string}>}
 */
export async function answer(env, question, history = [], archive = []) {
  const list = keys(env)
  if (list.length === 0) return { text: '', sources: [], error: 'model_yok' }

  const context = archiveContext(archive)
  const questionText = context ? `${context}SORU: ${question}` : question

  const attempts = [
    // 1) Web aramalı (en iyi sonuç, ücretli kademede çalışır)
    { tools: [{ googleSearch: {} }] },
    // 2) Arşive dayalı yedek
    { tools: undefined },
  ]

  let lastError = 'bilinmeyen_hata'
  for (const attempt of attempts) {
    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: buildContents(history, questionText),
      generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
    }
    if (attempt.tools) payload.tools = attempt.tools

    for (const model of ASSISTANT_MODELS) {
      for (const key of list) {
        try {
          const res = await fetch(ENDPOINT(model, key), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) {
            const detail = (await res.text()).slice(0, 180)
            lastError = `model_${model}: ${detail}`
            // 4xx'te anahtar/model değişikliği işe yaramaz, sonraki modele geç.
            if (res.status === 429 || res.status >= 500) continue
            break
          }
          const json = await res.json()
          const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ?? ''
          if (!part) continue
          const grounding = json?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
          const webSources = []
          for (const g of grounding) {
            const url = g?.web?.uri
            if (url && !webSources.includes(url)) webSources.push(url)
          }
          // Kaynak varsa önce web, yoksa arşiv kayıtları.
          const sources = webSources.length
            ? webSources.slice(0, 8).map((u) => ({ type: 'web', url: u }))
            : archive.slice(0, 6).map((n) => ({ type: 'news', slug: n.slug, title: n.title }))
          return { text: part.trim(), sources }
        } catch (err) {
          lastError = String(err?.message ?? err).slice(0, 180)
        }
      }
    }
  }
  return { text: '', sources: [], error: lastError }
}
