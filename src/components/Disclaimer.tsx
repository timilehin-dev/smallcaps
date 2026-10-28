import Link from 'next/link'
import { DISCLAIMER } from '@/lib/site'

export function Disclaimer() {
  return (
    <aside className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
      {DISCLAIMER} See our{' '}
      <Link href="/disclaimer" className="text-accent underline">
        full disclaimer
      </Link>
      .
    </aside>
  )
}
