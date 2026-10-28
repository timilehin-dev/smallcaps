import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-neutral-600">That page doesn’t exist or has moved.</p>
      <Link href="/" className="mt-6 inline-block text-accent underline">Back to the homepage</Link>
    </div>
  )
}
