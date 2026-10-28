import type { Metadata } from 'next'
import { SITE_NAME, TAGLINE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About & Methodology',
  description: 'How ' + SITE_NAME + ' researches and covers small caps on the Nigerian, Ghanaian and Kenyan exchanges.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">About {SITE_NAME}</h1>
      <p className="mt-4 text-neutral-700">{TAGLINE}.</p>

      <h2 className="mt-8 text-xl font-semibold tracking-tight">What we cover</h2>
      <p className="mt-2 text-neutral-700">
        Small and mid-cap companies listed on the Nigerian Exchange (NGX), the Ghana Stock
        Exchange (GSE) and the Nairobi Securities Exchange (NSE): short sourced news briefs,
        daily market wraps, in-depth equity analysis, and macro developments that move local equities.
      </p>

      <h2 className="mt-8 text-xl font-semibold tracking-tight">Methodology</h2>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-neutral-700">
        <li>Claims are sourced: exchange filings, company announcements, reputable local press and central-bank data.</li>
        <li>Every metric table carries an <em>as-of</em> timestamp in the relevant exchange's local time zone (Lagos, Accra, Nairobi).</li>
        <li>Corrections are made transparently: a wrong or misleading article is retracted in place with a correction note, not silently removed.</li>
        <li>Research and content are produced with the assistance of automated agents; the editorial standard is the same human one: no recommendation, no hype.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold tracking-tight">Standards</h2>
      <p className="mt-2 text-neutral-700">
        Nothing published here is investment advice. We do not hold positions in the companies we
        cover, and we do not take payment tied to price targets. Read the full{' '}
        <a href="/disclaimer" className="text-accent underline">disclaimer</a>.
      </p>
    </div>
  )
}