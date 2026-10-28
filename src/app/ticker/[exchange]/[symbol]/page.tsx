import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostCard } from '@/components/PostCard'
import { publishedByTicker } from '@/lib/posts'
import { EXCHANGES } from '@/lib/schemas'
import type { Exchange } from '@/lib/schemas'
import { EXCHANGE_NAME, SITE_NAME } from '@/lib/site'
import { getDb } from '@/lib/db'

export const revalidate = 60

export function generateStaticParams() {
  return getDb()
    .post.findMany({ where: { status: 'published' }, select: { tickers: true } })
    .then((rows) => {
      const seen = new Set<string>()
      const out: { exchange: string; symbol: string }[] = []
      for (const r of rows) {
        for (const t of r.tickers) {
          const [ex, sym] = t.split(':')
          if (!ex || !sym || seen.has(t)) continue
          seen.add(t)
          out.push({ exchange: ex.toLowerCase(), symbol: sym.toLowerCase() })
        }
      }
      return out
    })
}

function resolve(exchange: string, symbol: string): { ex: Exchange; sym: string } | null {
  const ex = exchange.toUpperCase()
  if (!(EXCHANGES as readonly string[]).includes(ex)) return null
  return { ex: ex as Exchange, sym: symbol.toUpperCase() }
}

export async function generateMetadata({ params }: { params: Promise<{ exchange: string; symbol: string }> }): Promise<Metadata> {
  const { exchange, symbol } = await params
  const v = resolve(exchange, symbol)
  if (!v) return {}
  return {
    title: `${v.ex}:${v.sym}`,
    description: `Latest ${SITE_NAME} coverage of ${v.ex}:${v.sym}.`,
    alternates: { canonical: `/ticker/${exchange}/${encodeURIComponent(symbol)}` },
  }
}

export default async function TickerPage({ params }: { params: Promise<{ exchange: string; symbol: string }> }) {
  const { exchange, symbol } = await params
  const v = resolve(exchange, symbol)
  if (!v) notFound()
  const posts = await publishedByTicker(`${v.ex}:${v.sym}`)
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm uppercase tracking-wide text-neutral-400">Ticker</p>
      <h1 className="text-3xl font-bold tracking-tight">{v.ex}:{v.sym}</h1>
      <p className="mt-1 text-neutral-500">
        {EXCHANGE_NAME[v.ex]} · {posts.length} {posts.length === 1 ? 'article' : 'articles'}
      </p>
      {posts.length === 0 ? (
        <p className="mt-8 text-neutral-500">No published articles for {v.ex}:{v.sym} yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}