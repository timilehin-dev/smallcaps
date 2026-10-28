import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { SECTIONS, SITE_NAME, TAGLINE, siteUrl } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} — ${TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: 'Independent small-cap equity research and daily market intelligence for the Nigerian, Ghanaian and Kenyan exchanges.',
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
  openGraph: { siteName: SITE_NAME, type: 'website' },
  twitter: { card: 'summary' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Frontier<span className="text-accent">Cap</span>
            </Link>
            <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-700" aria-label="Main">
              {Object.entries(SECTIONS).map(([key, s]) => (
                <Link key={key} href={`/${key}`} className="hover:text-accent">{s.title}</Link>
              ))}
              <Link href="/search" className="hover:text-accent">Search</Link>
              <Link href="/about" className="hover:text-accent">About</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-neutral-200">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-500">
            <p>© {new Date().getFullYear()} {SITE_NAME}. Information for educational purposes only; not investment advice.</p>
            <p className="mt-2 flex gap-4">
              <Link href="/about" className="hover:text-accent">About &amp; Methodology</Link>
              <Link href="/disclaimer" className="hover:text-accent">Disclaimer</Link>
              <a href="/feed.xml" className="hover:text-accent">RSS</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
