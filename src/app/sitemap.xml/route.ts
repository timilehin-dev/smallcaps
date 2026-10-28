import { allPublishedForIndex } from '@/lib/posts'
import { SECTIONS, siteUrl } from '@/lib/site'

export const revalidate = 60

export async function GET() {
  const base = siteUrl()
  const posts = await allPublishedForIndex()

  const tickers = new Set<string>()
  for (const p of posts) for (const t of p.tickers) tickers.add(t)

  const statics = [
    { url: `${base}/`, change: 'hourly', prio: 1 },
    ...Object.keys(SECTIONS).map((s) => ({ url: `${base}/${s}`, change: 'daily', prio: 0.8 })),
    { url: `${base}/about`, change: 'monthly', prio: 0.5 },
    { url: `${base}/disclaimer`, change: 'yearly', prio: 0.3 },
    { url: `${base}/search`, change: 'monthly', prio: 0.3 },
  ]
  const postRows = posts.map((p) => ({
    url: `${base}/posts/${p.slug}`,
    lastmod: p.updatedAt.toISOString().slice(0, 10),
    change: 'weekly',
    prio: 0.7,
  }))
  const tickerRows = [...tickers].map((t) => {
    const [ex, sym] = t.split(':')
    return {
      url: `${base}/ticker/${ex.toLowerCase()}/${encodeURIComponent(sym.toLowerCase())}`,
      lastmod: '',
      change: 'weekly',
      prio: 0.5,
    }
  })

  const all = [
    ...statics.map((r) => ({ ...r, lastmod: '' })),
    ...postRows,
    ...tickerRows,
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (r) => `  <url>
    <loc>${r.url}</loc>${r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : ''}
    <changefreq>${r.change}</changefreq>
    <priority>${r.prio}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}