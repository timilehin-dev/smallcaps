import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { Markdown } from '@/components/Markdown'
import { MetricsTable } from '@/components/MetricsTable'
import { TickerChips } from '@/components/Chips'
import { Disclaimer } from '@/components/Disclaimer'
import { findRedirect, getBySlug, postUrl } from '@/lib/posts'
import { fmtDate } from '@/lib/format'
import { CATEGORY_LABEL, EXCHANGE_NAME, SITE_NAME } from '@/lib/site'
import { getDb } from '@/lib/db'
import type { Post } from '@/generated/prisma/client'
import type { Exchange } from '@/lib/schemas'

export const revalidate = 60

export function generateStaticParams() {
  return getDb()
    .post.findMany({ select: { slug: true } })
    .then((rows) => rows.map((r) => ({ slug: r.slug })))
}

async function loadPost(slug: string): Promise<{ post: Post | null; redirectSlug: string | null }> {
  const post = await getBySlug(slug)
  if (post) return { post, redirectSlug: null }
  const redir = await findRedirect(slug)
  if (redir) return { post: null, redirectSlug: redir.post.slug }
  return { post: null, redirectSlug: null }
}

function buildMeta(post: Post): Metadata {
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: postUrl(post.slug) },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: { card: 'summary', title: post.title, description: post.excerpt },
    ...(post.status === 'retracted' ? { robots: { index: false, follow: true } } : {}),
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { post, redirectSlug } = await loadPost(slug)
  if (redirectSlug) {
    const target = await getBySlug(redirectSlug)
    if (target) return buildMeta(target)
    notFound()
  }
  if (!post) notFound()
  return buildMeta(post)
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { post, redirectSlug } = await loadPost(slug)
  if (redirectSlug) redirect(`/posts/${redirectSlug}`)
  if (!post) notFound()

  const ex = post.exchange as Exchange | null

  return (
    <article className="mx-auto max-w-3xl">
      {post.status === 'retracted' ? (
        <div role="alert" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">This article has been retracted.</p>
          {post.correctionNote ? <p className="mt-1">Correction: {post.correctionNote}</p> : null}
          <p className="mt-1 text-amber-800">It is kept for transparency but removed from lists, RSS, and search.</p>
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span className="font-semibold uppercase tracking-wide text-accent">{CATEGORY_LABEL[post.category]}</span>
        {ex ? <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium">{EXCHANGE_NAME[ex]}</span> : null}
        <time dateTime={post.publishedAt.toISOString()}>{fmtDate(post.publishedAt, ex, true)}</time>
      </div>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-lg text-neutral-600">{post.excerpt}</p>

      <div className="mt-4"><TickerChips tickers={post.tickers} /></div>
      <div className="my-6"><MetricsTable metrics={post.metrics} /></div>
      <div className="my-6"><Markdown source={post.bodyMd} /></div>

      {post.sources?.length ? (
        <div className="mt-8 border-t border-neutral-200 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Sources</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {post.sources.map((s, i) => (
              <li key={i}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="text-accent">{s}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {post.asOf ? (
        <p className="mt-6 text-xs text-neutral-400">
          Data as of {fmtDate(post.asOf, ex, true)}{ex ? ` · ${EXCHANGE_NAME[ex]} time` : ''}.
        </p>
      ) : null}

      <Disclaimer />

      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME },
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl(post.slug) },
      }} />
    </article>
  )
}