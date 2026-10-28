import { allPublishedForIndex } from '@/lib/posts'
import { CATEGORY_LABEL, siteUrl } from '@/lib/site'

export const revalidate = 60

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export async function GET() {
  const posts = await allPublishedForIndex()
  const base = siteUrl()
  const items = posts
    .map((p) => {
      const url = `${base}/posts/${p.slug}`
      return [
        '    <item>',
        `      <title>${esc(p.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <description>${esc(p.excerpt)}</description>`,
        `      <category>${esc(CATEGORY_LABEL[p.category])}</category>`,
        ...p.tickers.map((t) => `      <category>${esc(t)}</category>`),
        `      <pubDate>${p.publishedAt.toUTCString()}</pubDate>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FrontierCap</title>
    <link>${esc(base)}</link>
    <description>Independent small-cap equity research and daily market intelligence for NGX, GSE and NSE.</description>
    <language>en</language>
    <atom:link href="${esc(base)}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${(posts[0]?.publishedAt ?? new Date()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=60' },
  })
}
