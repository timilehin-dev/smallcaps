import Link from 'next/link'
import { notFound } from 'next/navigation'
import { publishedByCategory } from '@/lib/posts'
import { SECTIONS, type SectionKey } from '@/lib/site'
import { PostCard } from './PostCard'

const PER_PAGE = 12

export async function SectionView({ section, page }: { section: string; page: number }) {
  if (!(section in SECTIONS) || !Number.isInteger(page) || page < 1) notFound()
  const cfg = SECTIONS[section as SectionKey]
  const { posts, total } = await publishedByCategory(cfg.category, page, PER_PAGE)
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  if (page > pages) notFound()
  const href = (p: number) => (p === 1 ? `/${section}` : `/${section}/page/${p}`)

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{cfg.title}</h1>
      <p className="mt-1 text-neutral-600">{cfg.blurb}</p>
      <div className="mt-8 grid gap-4">
        {posts.length === 0 ? <p className="text-neutral-500">Nothing published here yet.</p> : null}
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
      {pages > 1 ? (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? <Link href={href(page - 1)} rel="prev" className="text-accent">← Newer</Link> : <span />}
          <span className="text-neutral-500">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(page + 1)} rel="next" className="text-accent">Older →</Link> : <span />}
        </nav>
      ) : null}
    </div>
  )
}
