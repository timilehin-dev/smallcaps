import 'dotenv/config'
import { afterAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { getDb } from './db'
import { createPost, findRedirect, getBySlug, latestPublished, listPosts, retractPost, updatePost } from './posts'
import type { CreateInput } from './schemas'

const skip = !process.env.DATABASE_URL
const T = 30_000

describe.skipIf(skip)('posts layer (integration, live Neon dev branch)', () => {
  const ids: string[] = []
  afterAll(async () => {
    if (ids.length) await getDb().post.deleteMany({ where: { id: { in: ids } } })
  })

  const mk = (n: string, extra: Partial<CreateInput> = {}): CreateInput => ({
    title: 'Integration ' + n + ' ' + randomUUID().slice(0, 8),
    category: 'news_brief',
    excerpt: 'Integration test post; illustrative only.',
    body_md: '# Test\n\nBody.',
    client_ref: 'itest-' + n + '-' + randomUUID(),
    published_at: new Date(),
    ...extra,
  })

  it('creates a post with a dated slug', async () => {
    const r = await createPost(mk('create'))
    expect(r.created).toBe(true)
    expect(r.post.slug).toMatch(/\d{4}-\d{2}-\d{2}$/)
    ids.push(r.post.id)
  }, T)

  it('replays the same client_ref -> 200 same id, exactly one row', async () => {
    const input = mk('replay')
    const r1 = await createPost(input)
    const r2 = await createPost(input)
    expect(r1.created).toBe(true)
    expect(r2.created).toBe(false)
    expect(r2.post.id).toBe(r1.post.id)
    expect(await getDb().post.count({ where: { clientRef: input.client_ref } })).toBe(1)
    ids.push(r1.post.id)
  }, T)

  it('20 identical client_ref POSTs in parallel -> exactly one created, one row', async () => {
    const input = mk('conc')
    const results = await Promise.all(Array.from({ length: 20 }, () => createPost(input)))
    expect(results.filter((r) => r.created).length).toBe(1)
    expect(new Set(results.map((r) => r.post.id)).size).toBe(1)
    expect(await getDb().post.count({ where: { clientRef: input.client_ref } })).toBe(1)
    ids.push(results[0].post.id)
  }, T)

  it('a title change re-slugs and leaves a PostRedirect behind', async () => {
    const { post } = await createPost(mk('redirect'))
    ids.push(post.id)
    const oldSlug = post.slug
    const updated = await updatePost(post.id, { title: post.title + ' (revised)' })
    expect(updated.slug).not.toBe(oldSlug)
    const redir = await findRedirect(oldSlug)
    expect(redir?.post?.slug).toBe(updated.slug)
    expect((await getBySlug(updated.slug))?.id).toBe(post.id)
  }, T)

  it('PATCH without a title leaves slug, exchange, tickers untouched', async () => {
    const input: CreateInput = { ...mk('patch'), exchange: 'NGX', tickers: ['NGX:DANG'], sentiment: 'positive' }
    const { post } = await createPost(input)
    ids.push(post.id)
    const updated = await updatePost(post.id, { excerpt: 'New excerpt, at least 10 chars long.' })
    expect(updated.excerpt).toBe('New excerpt, at least 10 chars long.')
    expect(updated.slug).toBe(post.slug)
    expect(updated.exchange).toBe('NGX')
    expect(updated.tickers).toEqual(['NGX:DANG'])
    expect(updated.sentiment).toBe('positive')
  }, T)

  it('retract soft-deletes: row kept, hidden from public, filterable', async () => {
    const { post } = await createPost(mk('retract'))
    ids.push(post.id)
    const retracted = await retractPost(post.id, 'typo in figures')
    expect(retracted.status).toBe('retracted')
    expect(retracted.correctionNote).toBe('typo in figures')
    const latest = await latestPublished(500)
    expect(latest.some((p) => p.id === post.id)).toBe(false)
    const listed = await listPosts({ page: 1, per_page: 100, status: 'retracted' })
    expect(listed.data.some((p) => p.id === post.id)).toBe(true)
  }, T)

  it('same title + same day collides -> second gets a suffixed slug', async () => {
    const sharedTitle = 'Slug collision ' + randomUUID().slice(0, 6)
    const pair = (ref: string): CreateInput => ({
      title: sharedTitle,
      category: 'news_brief',
      excerpt: 'Excerpt for the collision test post.',
      body_md: '# T\n\nx',
      client_ref: ref,
      published_at: new Date(),
    })
    const a = await createPost(pair('col-a-' + randomUUID()))
    const b = await createPost(pair('col-b-' + randomUUID()))
    expect(a.post.slug).not.toBe(b.post.slug)
    ids.push(a.post.id, b.post.id)
  }, T)

  it('rejects an empty patch and unknown refs', async () => {
    const { post } = await createPost(mk('empty'))
    ids.push(post.id)
    await expect(updatePost(post.id, {})).rejects.toMatchObject({ status: 400, code: 'validation_error' })
    await expect(
      updatePost('no-such-ref-' + randomUUID(), { excerpt: 'Whatever the new excerpt says.' }),
    ).rejects.toMatchObject({ status: 404, code: 'not_found' })
  }, T)
})