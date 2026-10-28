import type { Metadata } from 'next'
import { SearchBox } from '@/components/SearchBox'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search FrontierCap posts by title, ticker or tag.',
  alternates: { canonical: '/search' },
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>
      <p className="mt-1 text-neutral-600">
        Search across published posts by title, ticker, tag or exchange.
      </p>
      <div className="mt-6">
        <SearchBox />
      </div>
    </div>
  )
}
