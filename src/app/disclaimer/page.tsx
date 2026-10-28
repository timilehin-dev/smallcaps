import type { Metadata } from 'next'
import Link from 'next/link'
import { DISCLAIMER, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: `Full disclaimer for ${SITE_NAME}: informational content only, not investment advice.`,
  alternates: { canonical: '/disclaimer' },
}

export default function DisclaimerPage() {
  return (
    <div className="prose prose-neutral mx-auto max-w-3xl prose-headings:tracking-tight prose-a:text-accent">
      <h1>Disclaimer</h1>

      <p className="font-medium">{DISCLAIMER}</p>

      <h2>No offer or recommendation</h2>
      <p>
        The content on {SITE_NAME} is published for educational and informational purposes only. It does not
        constitute investment advice, a recommendation, or an offer or solicitation to buy or sell any security,
        and it should not be relied upon as the basis for any investment decision.
      </p>

      <h2>Risk</h2>
      <p>
        Investing in securities involves risk, including the possible loss of all capital invested. Past
        performance is not a guide to future results. Small-capitalisation securities in particular can be
        illiquid and volatile.
      </p>

      <h2>Automated analysis</h2>
      <p>
        Some posts are produced with the assistance of automated (AI) analysis tools and are labelled as
        AI-assisted. While we take reasonable care to check figures against the listed sources, automated output
        can contain errors. Always verify information independently.
      </p>

      <h2>Accuracy and corrections</h2>
      <p>
        We aim to be accurate but make no warranty that content is complete, current or error-free. Where a post
        is found to be wrong we retract it and display a correction notice; the post is excluded from feeds,
        sitemaps and index pages but kept online for transparency.
      </p>

      <h2>Third-party links</h2>
      <p>
        Links to third-party sources are provided for reference. We are not responsible for their content.
      </p>

      <h2>Professional advice</h2>
      <p>
        Do your own research and consult a licensed, qualified financial adviser before making any investment
        decision.
      </p>

      <p>
        <Link href="/about">Read about our methodology</Link>.
      </p>
    </div>
  )
}
