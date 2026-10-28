import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { Markdown } from '@/components/Markdown'
import { MetricsTable } from '@/components/MetricsTable'
import { TickerChips } from '@/components/Chips'
import { Disclaimer } from '@/components/Disclaimer'
import { JsonLd } from '@/components/JsonLd'
import { findRedirect, getBySlug } from '@/lib/posts'
import { CATEGORY_LABEL, CATEGORY_SECTION, EXCHANGE_NAME, SITE_NAME, siteUrl } from '@/lib/site'
import { fmtDate } from '@/lib/format'

export const revalidate = 60
export const dynamicParams = true

// Nothing is prerendered at build time, so `next build` never needs a database.
export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBySlug(slug)
  if (!post) return {}
  const retracted = post.status === 'retracted'
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/posts/${post.slug}` },
    ...(retracted ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      title: post.title,
      description: post.excerpt,
      url: `${siteUrl()}/posts/${post.slug}`,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      ...(post.exchange ? { section: EXCHANGE_NAME[post.exchange] } : {}),
    },
    twitter: { card: 'summary', title: post.title, description: post.excerpt },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBySlug(slug)
  if (!post) {
    const redirect = await findRedirect(slug)
    if (redirect) permanentRedirect(`/posts/${redirect.post.slug}`)
    notFound()
  }

  const retracted = post.status === 'retracted'
  const isSample = post.tags.includes('sample')
  const url = `${siteUrl()}/posts/${post.slug}`
  const asOf = post.asOf ?? post.publishedAt

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl() },
    ...(post.exchange ? { about: EXCHANGE_NAME[post.exchange] } : {}),
    ...(post.sentiment ? { genre: post.sentiment } : {}),
    isAccessibleForFree: true,
  }

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={jsonLd} />

      {retracted ? (
        <div role="alert" className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <p className="font-semibold text-red-900">Correction notice — this post has been retracted.</p>
          {post.correctionNote ? (
            <p className="mt-1 text-sm text-red-800">{post.correctionNote}</p>
          ) : (
            <p className="mt-1 text-sm text-red-800">The publisher withdrew this analysis.</p>
          )}
          <p className="mt-2 text-xs text-red-700">
            It is kept online for transparency and is excluded from feeds, sitemaps and index pages.
          </p>
        </div>
      ) : null}

      {isSample ? (
        <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Illustrative sample.</strong> This post is placeholder content with fictional companies and
          figures. It is not research and must not be relied on.
        </p>
      ) : null}

      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <Link
            href={`/${CATEGORY_SECTION[post.category]}`}
            className="font-semibold uppercase tracking-wide text-accent"
          >
            {CATEGORY_LABEL[post.category]}
          </Link>
          {post.exchange ? (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium">{post.exchange}</span>
          ) : null}
          <time dateTime={post.publishedAt.toISOString()}>{fmtDate(post.publishedAt, post.exchange, true)}</time>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-lg text-neutral-600">{post.excerpt}</p>
        <p className="mt-3 text-xs text-neutral-500">
          AI-assisted analysis. Reviewed against the sources listed below; figures are as of{' '}
          <time dateTime={asOf.toISOString()}>{fmtDate(asOf, post.exchange)}</time>.
        </p>
        {post.tickers.length ? (
          <div className="mt-4">
            <TickerChips tickers={post.tickers} />
          </div>
        ) : null}
      </header>

      <MetricsTable metrics={post.metrics} />

      <div className="mt-8">
        <Markdown source={post.bodyMd} />
      </div>

      {post.sources.length ? (
        <section className="mt-10 border-t border-neutral-200 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Sources</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {post.sources.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="break-all text-accent underline">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Disclaimer />
    </article>
  )
}
