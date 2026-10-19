/** Yabancı dilde eğitim haberi kaynakları: erişilebilirlik + RSS ölçümü. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml, */*' }

const FEEDS = [
  ['The Guardian Education', 'https://www.theguardian.com/education/rss'],
  ['Education Dive', 'https://www.educationdive.com/feeds/news/'],
  ['K-12 Dive', 'https://www.k12dive.com/feeds/news/'],
  ['EdSurge', 'https://www.edsurge.com/articles_rss'],
  ['Inside Higher Ed', 'https://www.insidehighered.com/rss.xml'],
  ['NPR Education', 'https://feeds.npr.org/1013/rss.xml'],
  ['eCampus News', 'https://www.ecampusnews.com/feed/'],
  ['The Conversation US', 'https://theconversation.com/us/education/articles.atom'],
  ['Phys.org Education', 'https://phys.org/rss-feed/breaking/education-news/'],
  ['ScienceDaily', 'https://www.sciencedaily.com/rss/all.xml'],
  ['Hechinger Report', 'https://hechingerreport.org/feed/'],
  ['Education Next', 'https://www.educationnext.org/feed/'],
  ['THE News', 'https://www.timeshighereducation.com/news/rss'],
  ['Brookings Education', 'https://www.brookings.edu/topic/education/feed/'],
  ['LPI Harvard', 'https://www.lpi.harvard.edu/feed/'],
  ['ASCD', 'https://www.ascd.org/rss'],
  ['World Economic Forum', 'https://www.weforum.org/feed/'],
  ['Guardian World Education', 'https://www.theguardian.com/world/education/rss'],
  ['HuffPost Education', 'https://www.huffpost.com/section/education/feed'],
  ['Pew Research', 'https://www.pewresearch.org/feed/'],
  ['Education Week', 'https://www.edweek.org/education/feed'],
  ['NAEP/NCES', 'https://nces.ed.gov/feed'],
]

const EDU =
  /(school|student|teacher|education|college|university|classroom|curricul|learning|district|college|enrol|degree|preschool|kindergarten|academic|scholarship|test|tuition|policy|principal|kindergarten)/i

let toplam = 0
let calisan = 0
for (const [name, url] of FEEDS) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 18000)
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: H })
    clearTimeout(t)
    if (!res.ok) {
      console.log(`x ${name.padEnd(28)} HTTP ${res.status}`)
      continue
    }
    const body = await res.text()
    const items = [...body.matchAll(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi)]
    const titles = [...body.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)]
      .map((m) => m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim())
      .filter((x) => x.length > 20)
    const edu = titles.filter((x) => EDU.test(x)).length
    toplam += items.length
    calisan += 1
    console.log(
      `+ ${name.padEnd(28)} ${String(items.length).padStart(3)} kayit | egitim ${String(edu).padStart(2)} | ${(body.length / 1024).toFixed(0).padStart(4)} KB`,
    )
  } catch (e) {
    console.log(`x ${name.padEnd(28)} ${String(e.message).slice(0, 30)}`)
  }
}
console.log(`\n${calisan}/${FEEDS.length} kaynak calisiyor, toplam ${toplam} kayit`)