import { allPublishedForIndex } from '@/lib/posts'

export const revalidate = 60

export async function GET() {
  const posts = await allPublishedForIndex()
  const payload = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    exchange: p.exchange,
    tickers: p.tickers,
    tags: p.tags,
    publishedAt: p.publishedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
  return Response.json(payload, { headers: { 'content-type': 'application/json; charset=utf-8' } })
}