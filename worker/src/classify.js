/** Eğitim alaka filtresi, kategori tespiti ve yayın puanı. */
import {
  CATEGORY_RULES,
  EDUCATION_TERMS,
  VOCATIONAL_TERMS,
  NOISE_TITLE,
  BLOCKED_PATH,
} from './config.js'
import { fold } from './text.js'

const PROVINCES = [
  'Çorum', 'Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
  'Kayseri', 'Eskişehir', 'Diyarbakır', 'Şanlıurfa', 'Malatya', 'Samsun', 'Denizli', 'Kocaeli',
  'Aydın', 'Balıkesir', 'Muğla', 'Trabzon', 'Erzurum', 'Van', 'Zonguldak', 'Ordu', 'Rize',
  'Bolu', 'Çankırı', 'Sinop', 'Amasya', 'Tokat', 'Yozgat', 'Sivas', 'Kırıkkale', 'Mersin',
  'Kütahya', 'Aksaray', 'Niğde', 'Karaman', 'Batman', 'Mardin', 'Adıyaman',
]

const hits = (text, terms) => terms.reduce((n, term) => (text.includes(fold(term)) ? n + 1 : n), 0)

/**
 * Haberin eğitim haberi olup olmadığı.
 * Başlık büyük ağırlık taşır; açıklamadaki tek bir kelime geçer kılmaz.
 */
export function isEducationRelevant({ title = '', description = '', link = '' }) {
  if (BLOCKED_PATH.test(link)) return false
  const t = fold(title)
  if (NOISE_TITLE.test(title)) return false
  const d = fold(description).slice(0, 400)

  const titleHits = hits(t, EDUCATION_TERMS)
  if (titleHits === 0) return false
  if (titleHits === 1 && !VOCATIONAL_TERMS.some((v) => t.includes(fold(v)))) {
    // Tek zayıf eğitim kelimesi + açıklamada da destek yoksa geçme
    if (hits(d, EDUCATION_TERMS) < 2) return false
  }
  return true
}

export function detectCategory(text) {
  const f = fold(text)
  let best = { slug: 'gundem', score: 0 }
  for (const rule of CATEGORY_RULES) {
    let score = 0
    for (const term of rule.terms) if (f.includes(fold(term))) score += rule.weight
    if (score > best.score) best = { slug: rule.slug, score }
  }
  return best.slug
}

export function detectProvince(text) {
  const f = fold(text)
  for (const p of PROVINCES) if (f.includes(fold(p))) return p
  return null
}

const TRUSTED = /aa\.com\.tr|meb\.gov\.tr|hurriyet\.com\.tr|cumhuriyet\.com\.tr|sozcu\.com\.tr|trthaber|resmigazete|osym\.gov\.tr/

/** Alaka puanı 0–10. Eğitim dışı içerik 0 alır. */
export function scoreItem(item) {
  if (!isEducationRelevant(item)) return 0

  const text = `${item.title} ${item.description ?? ''}`
  const t = fold(item.title)
  const f = fold(text)
  let score = 1

  let ruleHits = 0
  for (const rule of CATEGORY_RULES) {
    if (rule.terms.some((term) => f.includes(fold(term)))) ruleHits += 1
  }
  score += Math.min(3.5, ruleHits * 1.1)

  // Mesleki eğitim önceliği
  if (hits(t, VOCATIONAL_TERMS) > 0) score += 1.5

  const province = detectProvince(text)
  if (province) score += 1
  if (province === 'Çorum') score += 1.5

  const ageH = (Date.now() - new Date(item.publishedAt).getTime()) / 3600_000
  if (ageH <= 6) score += 2
  else if (ageH <= 24) score += 1.5
  else if (ageH <= 48) score += 0.8
  else if (ageH <= 96) score += 0.3

  if (TRUSTED.test(item.link ?? '') || TRUSTED.test(item.sourceName ?? '')) score += 1
  if (item.direct) score += 1.2
  if (item.description && item.description.length > 90) score += 0.3

  return Math.min(10, Math.round(score * 10) / 10)
}
