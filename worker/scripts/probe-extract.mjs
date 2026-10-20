/** fetchArticle'ın gerçek metni ne kadar çıkardığını ölçer. */
import { fetchArticle } from '../src/article.js'

const urls = process.argv.slice(2)
const targets = urls.length
  ? urls
  : [
      'https://www.hurriyet.com.tr/egitim/turkiye-yuzyili-maarif-modelinin-3uncu-uygulama-yili-43338381',
    ]

for (const url of targets) {
  const r = await fetchArticle(url)
  const total = r.paragraphs.reduce((a, b) => a + b.length, 0)
  console.log(`\n${url.slice(0, 80)}`)
  console.log(`  paragraf: ${r.paragraphs.length} · toplam ${total} karakter`)
  r.paragraphs.slice(0, 3).forEach((p, i) => console.log(`   [${i}] ${p.slice(0, 120)}`))
}
