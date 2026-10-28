import type { Metadata } from 'next'
import Link from 'next/link'
import { EXCHANGE_NAME, SITE_NAME, TAGLINE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About & methodology',
  description: `How ${SITE_NAME} produces and labels independent small-cap research for NGX, GSE and NSE.`,
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <div className="prose prose-neutral mx-auto max-w-3xl prose-headings:tracking-tight prose-a:text-accent">
      <h1>About {SITE_NAME}</h1>
      <p>{TAGLINE}.</p>

      <h2>What we publish</h2>
      <ul>
        <li><strong>Market wraps</strong> — end-of-day summaries for each exchange.</li>
        <li><strong>Equity analysis</strong> — deeper looks at individual listed companies.</li>
        <li><strong>News briefs</strong> — short, sourced notes on company and market news.</li>
        <li><strong>Macro radar</strong> — rates, currencies and policy that move local equities.</li>
      </ul>

      <h2>How we work</h2>
      <p>
        Our research is produced with the assistance of automated analysis tools and reviewed against the
        sources listed on each post. Every post carries the date the underlying data refers to
        (<em>data as of</em>) so readers can judge how current it is.
      </p>

      <h2>Exchanges covered</h2>
      <ul>
        <li>{EXCHANGE_NAME.NGX} (NGX), Lagos</li>
        <li>{EXCHANGE_NAME.GSE} (GSE), Accra</li>
        <li>{EXCHANGE_NAME.NSE} (NSE), Nairobi</li>
      </ul>

      <h2>Corrections</h2>
      <p>
        Posts are published immediately. When a post is wrong or superseded we retract it rather than delete it:
        the page stays online with a correction notice, and it is removed from feeds, sitemaps and index pages.
      </p>

      <h2>Not investment advice</h2>
      <p>
        Nothing here is investment advice. See our <Link href="/disclaimer">full disclaimer</Link>.
      </p>
    </div>
  )
}
