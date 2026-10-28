import { revalidatePath } from 'next/cache'
import { Prisma } from '@/generated/prisma/client'
import type { Post } from '@/generated/prisma/client'
import { getDb } from './db'
import { ApiError } from './errors'
import { slugify, withSuffix } from './slug'
import { normalizeTickers } from './tickers'
import { siteUrl } from './site'
import type { Category, CreateInput, ListQuery, PatchInput } from './schemas'
import { EXCHANGES } from './schemas'

export const postUrl = (slug: string) => `${siteUrl()}/posts/${slug}`

export function serialize(p: Post) {
  return {
    id: p.id,
    slug: p.slug,
    url: postUrl(p.slug),
    title: p.title,
    category: p.category,
    exchange: p.exchange,
    tickers: p.tickers,
    tags: p.tags,
    excerpt: p.excerpt,
    body_md: p.bodyMd,
    metrics: p.metrics,
    sentiment: p.sentiment,
    status: p.status,
    correction_note: p.correctionNote,
    client_ref: p.clientRef,
    sources: p.sources,
    as_of: p.asOf ? p.asOf.toISOString() : null,
    published_at: p.publishedAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  }
}

/** Makes edits visible immediately; the 60s ISR window remains as a fallback. */
export function revalidateSite() {
  revalidatePath('/', 'layout')
}

/**
 * Retry on P2028 ("Unable to start a transaction in the given time") with
 * exponential backoff. This is the expected failure when `next build` runs
 * static generation across many workers against the shared Neon pooler, or
 * when a burst of ISR revalidations contends for pooled connections.
 */
async function withTxRetry<T>(fn: () => Promise<T>, attempts = 6): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      if ((e as { code?: string }).code !== 'P2028' || i === attempts - 1) throw e
      await new Promise((r) => setTimeout(r, 200 * 2 ** i))
    }
  }
  throw new Error('unreachable')
}

function isUnique(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const err = e as { code?: string; message?: string }
  return err.code === 'P2002' || /unique constraint/i.test(err.message ?? '')
}

const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))]

// ---------------------------------------------------------------- writes

export async function createPost(input: CreateInput): Promise<{ post: Post; created: boolean }> {
  const db = getDb()
  const findExisting = () =>
    input.client_ref ? db.post.findUnique({ where: { clientRef: input.client_ref } }) : Promise.resolve(null)

  const existing = await findExisting()
  if (existing) return { post: existing, created: false }

  const publishedAt = input.published_at ?? new Date()
  const tickers = normalizeTickers(input.tickers ?? [], input.exchange)
  const baseSlug = slugify(input.title, publishedAt)

  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = attempt === 0 ? baseSlug : withSuffix(baseSlug)
    try {
      const post = await db.post.create({
        data: {
          slug,
          title: input.title,
          category: input.category,
          exchange: input.exchange ?? null,
          tickers,
          tags: uniq(input.tags ?? []),
          excerpt: input.excerpt,
          bodyMd: input.body_md,
          metrics: (input.metrics ?? undefined) as Prisma.InputJsonValue | undefined,
          sentiment: input.sentiment ?? null,
          sources: input.sources ?? [],
          asOf: input.as_of ?? null,
          publishedAt,
          clientRef: input.client_ref ?? null,
        },
      })
      return { post, created: true }
    } catch (e) {
      if (!isUnique(e)) throw e
      // Either a concurrent request with the same client_ref won (replay), or the slug collided.
      const winner = await findExisting()
      if (winner) return { post: winner, created: false }
    }
  }
  throw new ApiError(409, 'duplicate_slug', 'Could not allocate a unique slug; try a different title')
}

export async function getByRef(ref: string) {
  return getDb().post.findFirst({ where: { OR: [{ id: ref }, { slug: ref }] } })
}

export async function updatePost(ref: string, patch: PatchInput): Promise<Post> {
  const db = getDb()
  const existing = await getByRef(ref)
  if (!existing) throw new ApiError(404, 'not_found', `No post with id or slug "${ref}"`)
  if (Object.keys(patch).length === 0) {
    throw new ApiError(400, 'validation_error', 'Provide at least one field to update')
  }

  const exchange = patch.exchange !== undefined ? patch.exchange : existing.exchange
  const data: Prisma.PostUpdateInput = {}
  if (patch.title !== undefined) data.title = patch.title
  if (patch.category !== undefined) data.category = patch.category
  if (patch.exchange !== undefined) data.exchange = patch.exchange
  if (patch.tickers !== undefined || patch.exchange !== undefined) {
    data.tickers = normalizeTickers(patch.tickers ?? existing.tickers, exchange)
  }
  if (patch.tags !== undefined) data.tags = uniq(patch.tags)
  if (patch.excerpt !== undefined) data.excerpt = patch.excerpt
  if (patch.body_md !== undefined) data.bodyMd = patch.body_md
  if (patch.metrics !== undefined) {
    data.metrics = patch.metrics === null ? Prisma.JsonNull : (patch.metrics as Prisma.InputJsonValue)
  }
  if (patch.sentiment !== undefined) data.sentiment = patch.sentiment
  if (patch.sources !== undefined) data.sources = patch.sources
  if (patch.as_of !== undefined) data.asOf = patch.as_of
  if (patch.published_at !== undefined) data.publishedAt = patch.published_at
  if (patch.status !== undefined) data.status = patch.status
  if (patch.correction_note !== undefined) data.correctionNote = patch.correction_note
  if (patch.status === 'published' && patch.correction_note === undefined) data.correctionNote = null

  const titleChanged = patch.title !== undefined && patch.title !== existing.title
  const baseSlug = titleChanged ? slugify(patch.title!, patch.published_at ?? existing.publishedAt) : null

  for (let attempt = 0; attempt < 6; attempt++) {
    const newSlug = baseSlug ? (attempt === 0 ? baseSlug : withSuffix(baseSlug)) : null
    try {
      return await withTxRetry(() =>
        db.$transaction(async (tx) => {
          const slugChanges = !!newSlug && newSlug !== existing.slug
          if (slugChanges) await tx.postRedirect.deleteMany({ where: { oldSlug: newSlug! } })
          const post = await tx.post.update({
            where: { id: existing.id },
            data: slugChanges ? { ...data, slug: newSlug! } : data,
          })
          if (slugChanges) {
            await tx.postRedirect.upsert({
              where: { oldSlug: existing.slug },
              create: { oldSlug: existing.slug, postId: existing.id },
              update: { postId: existing.id },
            })
          }
          return post
        }),
      )
    } catch (e) {
      if (isUnique(e) && newSlug) continue
      throw e
    }
  }
  throw new ApiError(409, 'duplicate_slug', 'Could not allocate a unique slug; try a different title')
}

export async function retractPost(ref: string, note?: string): Promise<Post> {
  const existing = await getByRef(ref)
  if (!existing) throw new ApiError(404, 'not_found', `No post with id or slug "${ref}"`)
  return getDb().post.update({
    where: { id: existing.id },
    data: { status: 'retracted', correctionNote: note ?? existing.correctionNote },
  })
}

// ---------------------------------------------------------------- reads (API)

export async function listPosts(q: ListQuery) {
  const where: Prisma.PostWhereInput = {}
  if (q.category) where.category = q.category
  if (q.exchange) where.exchange = q.exchange
  if (q.status) where.status = q.status
  if (q.tag) where.tags = { has: q.tag }
  if (q.ticker) {
    const t = q.ticker.toUpperCase()
    where.tickers = t.includes(':') ? { has: t } : { hasSome: EXCHANGES.map((x) => `${x}:${t}`) }
  }
  if (q.from || q.to) where.publishedAt = { ...(q.from && { gte: q.from }), ...(q.to && { lte: q.to }) }

  const db = getDb()
  const [data, total] = await withTxRetry(() =>
    db.$transaction([
      db.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (q.page - 1) * q.per_page,
        take: q.per_page,
      }),
      db.post.count({ where }),
    ]),
  )
  return { data, total }
}

// ---------------------------------------------------------------- reads (public site)

const published = { status: 'published' } as const

export const latestPublished = (limit: number) =>
  getDb().post.findMany({ where: published, orderBy: { publishedAt: 'desc' }, take: limit })

export async function publishedByCategory(category: Category, page: number, perPage: number) {
  const db = getDb()
  const where = { ...published, category }
  const [posts, total] = await withTxRetry(() =>
    db.$transaction([
      db.post.findMany({ where, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
      db.post.count({ where }),
    ]),
  )
  return { posts, total }
}

export const publishedByTicker = (ticker: string) =>
  getDb().post.findMany({
    where: { ...published, tickers: { has: ticker } },
    orderBy: { publishedAt: 'desc' },
    take: 100,
  })

export const getBySlug = (slug: string) => getDb().post.findUnique({ where: { slug } })

export const findRedirect = (oldSlug: string) =>
  getDb().postRedirect.findUnique({ where: { oldSlug }, include: { post: { select: { slug: true } } } })

export async function allPublishedForIndex() {
  return getDb().post.findMany({
    where: published,
    orderBy: { publishedAt: 'desc' },
    take: 5000,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      exchange: true,
      tickers: true,
      tags: true,
      publishedAt: true,
      updatedAt: true,
    },
  })
}