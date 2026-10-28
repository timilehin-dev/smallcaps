import { allPublishedForIndex } from '@/lib/posts'

export const revalidate = 60

/** Client-side search index: published posts only. */
export async function GET() {
  const posts = await allPublishedForIndex()
  return Response.json(
    posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      exchange: p.exchange,
      tickers: p.tickers,
      tags: p.tags,
      publishedAt: p.publishedAt.toISOString(),
    })),
    { headers: { 'cache-control': 'public, max-age=0, s-maxage=60' } },
  )
}
