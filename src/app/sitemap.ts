import type { MetadataRoute } from 'next'
import { allPublishedForIndex } from '@/lib/posts'
import { SECTIONS, siteUrl } from '@/lib/site'

export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const posts = await allPublishedForIndex()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    ...Object.keys(SECTIONS).map((s) => ({
      url: `${base}/${s}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/disclaimer`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/search`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Only published posts appear; retracted posts stay online but are not advertised.
  const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/posts/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const tickers = new Set<string>()
  for (const p of posts) for (const t of p.tickers) tickers.add(t)
  const tickerUrls: MetadataRoute.Sitemap = [...tickers].map((t) => {
    const [exchange, symbol] = t.split(':')
    return {
      url: `${base}/ticker/${exchange.toLowerCase()}/${encodeURIComponent(symbol.toLowerCase())}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }
  })

  return [...staticPages, ...postUrls, ...tickerUrls]
}
