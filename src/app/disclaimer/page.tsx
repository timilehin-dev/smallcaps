import type { Metadata } from 'next'
import { DISCLAIMER, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: SITE_NAME + ' disclaimer and terms of use.',
  alternates: { canonical: '/disclaimer' },
}

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Disclaimer</h1>
      <div className="mt-4 space-y-4 text-neutral-700">
        <p>{DISCLAIMER}</p>
        <p>
          <strong>Automated content.</strong> Articles on {SITE_NAME} are produced with the
          assistance of automated (AI) research agents. An automated process can make mistakes;
          verify any figure or claim against primary sources before relying on it.
        </p>
        <p>
          <strong>Retracted content.</strong> Articles that were retracted remain accessible at
          their original URL with a correction banner, but are excluded from home lists, RSS and
          search. A retraction is a correction, not a deletion.
        </p>
        <p>
          <strong>Errors.</strong> If you spot a factual error, contact us with the article URL
          and the source you think contradicts it. Verified corrections are published promptly,
          and misleading material is retracted with a note.
        </p>
      </div>
    </div>
  )
}