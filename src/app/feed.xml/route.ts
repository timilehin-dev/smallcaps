import { postUrl, allPublishedForIndex } from '@/lib/posts'
import { SITE_NAME, TAGLINE, siteUrl } from '@/lib/site'

export const revalidate = 60

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export async function GET() {
  const posts = await allPublishedForIndex()
  const base = siteUrl()
  const items = posts
    .map((p) => {
      const link = postUrl(p.slug)
      const guid = `${base}${link}`
      return [
        '  <item>',
        `    <title>${esc(p.title)}</title>`,
        `    <link>${esc(link)}</link>`,
        `    <guid isPermaLink="true">${esc(guid)}</guid>`,
        `    <description>${esc(p.excerpt)}</description>`,
        `    <pubDate>${p.publishedAt.toUTCString()}</pubDate>`,
        '    <category>',
        ...p.tickers.map((t) => `      <term>${esc(t)}</term>`),
        ...p.tags.map((t) => `      <term>${esc(t)}</term>`),
        '    </category>',
        '  </item>',
      ].join('\n')
    })
    .join('\n')
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(base)}</link>
    <description>${esc(TAGLINE)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${esc(base + '/feed.xml')}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`
  return new Response(rss, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}