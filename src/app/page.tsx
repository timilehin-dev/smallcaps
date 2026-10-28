import Link from 'next/link'
import { latestPublished } from '@/lib/posts'
import { CATEGORY_SECTION, SECTIONS, SITE_NAME, TAGLINE } from '@/lib/site'
import { PostCard } from '@/components/PostCard'

export const revalidate = 60

export default async function Home() {
  const posts = await latestPublished(60)
  const [hero, ...rest] = posts
  return (
    <div className="space-y-12">
      <h1 className="sr-only">{SITE_NAME} — {TAGLINE}</h1>
      <section aria-label="Latest post">
        <p className="mb-4 text-sm text-neutral-500">{TAGLINE}</p>
        {hero ? <PostCard post={hero} large headingLevel="h2" /> : <p className="text-neutral-500">No posts yet. Check back soon.</p>}
      </section>
      {Object.entries(SECTIONS).map(([key, s]) => {
        const items = rest.filter((p) => CATEGORY_SECTION[p.category] === key).slice(0, 4)
        if (items.length === 0) return null
        return (
          <section key={key}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
              <Link href={`/${key}`} className="text-sm text-accent">View all →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((p) => <PostCard key={p.slug} post={p} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
