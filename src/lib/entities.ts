/**
 * HTML entity çözümleme (güvenlik ağı).
 *
 * Toplayıcı artık `he` ile tüm HTML5 entity'lerini çözdüğü için metinler temiz
 * gelmeli. Yine de kaynak bir yandan bozulursa ekranda "&uuml;" gibi ham
 * metin görünmesin diye burada da çözüyoruz. Tarayıcının kendi çözümleyicisini
 * kullanıyoruz: ek bağımlılık yok ve tüm entity'leri bilir.
 */
export function decodeEntities(text: string): string {
  if (!text || !text.includes('&')) return text
  try {
    const doc = new DOMParser().parseFromString(text, 'text/html')
    return doc.documentElement.textContent ?? text
  } catch {
    return text
  }
}

/** Bir haber kaydındaki tüm metin alanlarını çözümler. */
export function decodeItem<T extends { title: string; excerpt: string; body: string[] }>(item: T): T {
  return {
    ...item,
    title: decodeEntities(item.title),
    excerpt: decodeEntities(item.excerpt),
    body: item.body.map(decodeEntities),
  }
}
