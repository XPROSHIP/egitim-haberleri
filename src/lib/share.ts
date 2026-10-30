export async function shareUrl(item: { title: string; slug: string }) {
  const url = `${window.location.origin}/haber/${item.slug}`
  const text = item.title
  if (navigator.share) {
    try {
      await navigator.share({ title: text, url })
      return
    } catch {
      /* kullanıcı vazgeçti */
    }
  }
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    window.prompt('Bağlantıyı kopyalayın:', url)
  }
}

export function shareToX(item: { title: string; slug: string }) {
  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(
    item.title,
  )}&url=${encodeURIComponent(`${window.location.origin}/haber/${item.slug}`)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function shareToWhatsApp(item: { title: string; slug: string }) {
  const url = `${window.location.origin}/haber/${item.slug}`
  const text = `${item.title}\n\n${url}`
  const target = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
  window.open(target, '_blank', 'noopener,noreferrer')
}

export function absoluteUrl(slug: string): string {
  return `${window.location.origin}/haber/${slug}`
}
