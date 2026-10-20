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
- Güncel bilgi gerekiyorsa (son duyurular, atama takvimleri, sınav sonuçları, yeni programlar) mutlaka web araması kullan ve güncel kaynaklara dayan.
- Arşivdeki (bu sitede yayımlanan) haberlerden bilinen bir şey varsa onu da belirt.
- Uydurma bilgi, sayı, tarih veya kurum adı verme. Emin değilsen "doğrulanamadı" de.
- Yanıt en fazla 3-4 paragraf olsun; gerekiyorsa kısa maddeler halinde yaz.
- Kaynak bağlantılarını en sonda "Kaynaklar:" başlığı altında tam URL olarak listele.
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

/**
 * Soruyu yanıtlar. Web araması (grounding) açıktır.
 * @returns {Promise<{text:string, sources:string[], error?:string}>}
 */
export async function answer(env, question, history = []) {
  const list = keys(env)
  if (list.length === 0) return { text: '', sources: [], error: 'model_yok' }

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: buildContents(history, question),
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
  }

  let lastError = 'bilinmeyen_hata'
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
          // 4xx: anahtar/model değişikliği işe yaramaz, sonraki modele geç.
          if (res.status === 429 || res.status >= 500) continue
          break
        }
        const json = await res.json()
        const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ?? ''
        const grounding = json?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
        const sources = []
        for (const g of grounding) {
          const url = g?.web?.uri
          if (url && !sources.includes(url)) sources.push(url)
        }
        return { text: part.trim(), sources: sources.slice(0, 8) }
      } catch (err) {
        lastError = String(err?.message ?? err).slice(0, 180)
      }
    }
  }
  return { text: '', sources: [], error: lastError }
}
