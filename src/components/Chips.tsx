import Link from 'next/link'
import { tickerHref } from '@/lib/format'

export function TickerChips({ tickers }: { tickers: string[] }) {
  if (!tickers.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tickers.map((t) => (
        <li key={t}>
          <Link
            href={tickerHref(t)}
            className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-medium text-accent hover:border-accent"
          >
            {t.replace(':', ' · ')}
          </Link>
        </li>
      ))}
    </ul>
  )
}
