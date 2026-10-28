import Link from 'next/link'
import type { Post } from '@/generated/prisma/client'
import { CATEGORY_LABEL } from '@/lib/site'
import { fmtDate } from '@/lib/format'
import { TickerChips } from './Chips'

export type CardPost = Pick<Post, 'slug' | 'title' | 'excerpt' | 'category' | 'exchange' | 'tickers' | 'publishedAt'>

export function PostCard({ post, large = false }: { post: CardPost; large?: boolean }) {
  return (
    <article className={`rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-300 ${large ? 'sm:p-8' : ''}`}>
      <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
        <span className="font-semibold uppercase tracking-wide text-accent">{CATEGORY_LABEL[post.category]}</span>
        {post.exchange ? <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium">{post.exchange}</span> : null}
        <time dateTime={post.publishedAt.toISOString()}>{fmtDate(post.publishedAt, post.exchange)}</time>
      </div>
      <h3 className={`font-semibold tracking-tight ${large ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>
        <Link href={`/posts/${post.slug}`} className="hover:text-accent">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 text-neutral-600">{post.excerpt}</p>
      <div className="mt-3">
        <TickerChips tickers={post.tickers} />
      </div>
    </article>
  )
}
