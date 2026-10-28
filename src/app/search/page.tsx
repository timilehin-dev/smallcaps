import type { Metadata } from 'next'
import { SearchBox } from '@/components/SearchBox'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search FrontierCap articles, tickers and tags.',
  alternates: { canonical: '/search' },
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>
      <p className="mt-1 text-neutral-500">Titles, excerpts, tickers, tags and exchanges.</p>
      <div className="mt-6">
        <SearchBox />
      </div>
    </div>
  )
}