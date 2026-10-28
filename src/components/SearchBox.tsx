'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Item = { slug: string; title: string; excerpt: string; category: string; exchange: string | null; tickers: string[]; tags: string[]; publishedAt: string }

export function SearchBox() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setError(true))
  }, [])

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!items || terms.length === 0) return []
    return items
      .filter((i) => {
        const hay = `${i.title} ${i.excerpt} ${i.tickers.join(' ')} ${i.tags.join(' ')} ${i.exchange ?? ''}`.toLowerCase()
        return terms.every((t) => hay.includes(t))
      })
      .slice(0, 50)
  }, [items, q])

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search titles, tickers and tags…"
        aria-label="Search"
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-accent"
      />
      {error ? <p className="mt-4 text-red-700">Search is unavailable right now.</p> : null}
      {!items && !error ? <p className="mt-4 text-neutral-500">Loading…</p> : null}
      {items && q && results.length === 0 ? <p className="mt-4 text-neutral-500">No matches.</p> : null}
      <ul className="mt-6 divide-y divide-neutral-100">
        {results.map((r) => (
          <li key={r.slug} className="py-3">
            <Link href={`/posts/${r.slug}`} className="font-medium hover:text-accent">{r.title}</Link>
            <p className="text-sm text-neutral-600">{r.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
