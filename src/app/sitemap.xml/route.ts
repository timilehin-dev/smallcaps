import { allPublishedForIndex, postUrl } from '@/lib/posts'
import { siteUrl } from '@/lib/site'

export const revalidate = 60

export async function GET() {
  const base = siteUrl()
  const statics = [
    `${base}/`,
    `${base}/news`,
    `${base}/market-wraps`,
    `${base}/research`,
    `${base}/macro`,
    `${base}/about`,
    `${base}/disclaimer`,
    `${base}/search`,
  ]
  const posts = await allPublishedForIndex()
  const urls = [
    ...statics,
    ...posts.map((p) => postUrl(p.slug)),
  ]
  const today = new Date().toISOString().slice(0, 10)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>
    <loc>${u}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}