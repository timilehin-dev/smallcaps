import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostCard } from '@/components/PostCard'
import { publishedByTicker } from '@/lib/posts'
import { EXCHANGE_NAME } from '@/lib/site'
import { EXCHANGES, type Exchange } from '@/lib/schemas'

export const revalidate = 60
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ exchange: string; symbol: string }> }

function resolve(exchange: string, symbol: string): { exchange: Exchange; ticker: string } | null {
  const ex = exchange.toUpperCase()
  if (!(EXCHANGES as readonly string[]).includes(ex)) return null
  const sym = decodeURIComponent(symbol).toUpperCase()
  if (!/^[A-Z0-9.\-]{1,24}$/.test(sym)) return null
  return { exchange: ex as Exchange, ticker: `${ex}:${sym}` }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exchange, symbol } = await params
  const r = resolve(exchange, symbol)
  if (!r) return {}
  const title = `${r.ticker} coverage`
  return {
    title,
    description: `FrontierCap posts mentioning ${r.ticker} on the ${EXCHANGE_NAME[r.exchange]}.`,
    alternates: { canonical: `/ticker/${r.exchange.toLowerCase()}/${encodeURIComponent(r.ticker.split(':')[1].toLowerCase())}` },
  }
}

export default async function TickerPage({ params }: Props) {
  const { exchange, symbol } = await params
  const r = resolve(exchange, symbol)
  if (!r) notFound()

  const posts = await publishedByTicker(r.ticker)

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">{EXCHANGE_NAME[r.exchange]}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{r.ticker}</h1>
      <p className="mt-1 text-neutral-600">
        {posts.length} published {posts.length === 1 ? 'post' : 'posts'} mentioning this ticker.
      </p>
      <div className="mt-8 grid gap-4">
        {posts.length === 0 ? <p className="text-neutral-500">Nothing published for this ticker yet.</p> : null}
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
    </div>
  )
}
