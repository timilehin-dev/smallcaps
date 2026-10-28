import { siteUrl } from '@/lib/site'

export const revalidate = 86400

export async function GET() {
  const base = siteUrl()
  const txt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /openapi.json

Sitemap: ${base}/sitemap.xml`
  return new Response(txt, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}