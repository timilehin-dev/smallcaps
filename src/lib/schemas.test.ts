import { describe, expect, it } from 'vitest'
import {
  createSchema,
  patchSchema,
  deleteSchema,
  listQuerySchema,
  MAX_BODY_BYTES,
  EXCHANGES,
} from './schemas'

const ok = {
  title: 'NEXIM FX earnings push stock to record high',
  category: 'equity_analysis',
  excerpt: 'Strong forex results lift NEXIM to an all-time high close.',
  body_md: '# NEXIM\n\nRecord close on FX strength.',
  exchange: 'NGX',
  tickers: ['NGX:NGXNG'],
  tags: ['small-caps', 'fx'],
  sentiment: 'positive',
  sources: ['https://example.com/news/1'],
  client_ref: 'agent-1',
}

describe('createSchema', () => {
  it('accepts a full payload', () => {
    const p = createSchema.parse(ok)
    expect(p.title).toBe(ok.title)
    expect(p.client_ref).toBe('agent-1')
  })
  it('accepts a minimal payload', () => {
    const p = createSchema.parse({
      title: 'Short note headline',
      category: 'news_brief',
      excerpt: 'A ten-or-more character excerpt.',
      body_md: 'x',
    })
    expect(p.tickers).toBeUndefined()
    expect(p.published_at).toBeUndefined()
  })
  it('rejects unknown fields (strict mode)', () => {
    expect(createSchema.safeParse({ ...ok, surprise: 1 }).success).toBe(false)
  })
  it('enforces title length bounds (5..200)', () => {
    expect(createSchema.safeParse({ ...ok, title: 'ab' }).success).toBe(false)
    expect(createSchema.safeParse({ ...ok, title: 't'.repeat(200) }).success).toBe(true)
    expect(createSchema.safeParse({ ...ok, title: 't'.repeat(201) }).success).toBe(false)
  })
  it('enforces the 200KB body_md limit at the byte boundary', () => {
    expect(createSchema.safeParse({ ...ok, body_md: 'x'.repeat(MAX_BODY_BYTES + 1) }).success).toBe(false)
    expect(createSchema.safeParse({ ...ok, body_md: 'x'.repeat(MAX_BODY_BYTES) }).success).toBe(true)
  })
  it('validates ticker format and the 20-ticker cap', () => {
    expect(createSchema.safeParse({ ...ok, tickers: ['XX:ABC'] }).success).toBe(false)
    expect(createSchema.safeParse({ ...ok, tickers: ['NGX:ABC'] }).success).toBe(true)
    const many = Array.from({ length: 21 }, (_, i) => 'NGX:Z' + i)
    expect(createSchema.safeParse({ ...ok, tickers: many }).success).toBe(false)
  })
  it('coerces dates and requires URLs for sources', () => {
    const p = createSchema.parse({
      ...ok,
      as_of: '2026-01-02T00:00:00.000Z',
      published_at: '2026-01-02T00:00:00.000Z',
    })
    expect(p.as_of).toBeInstanceOf(Date)
    expect(p.published_at).toBeInstanceOf(Date)
    expect(createSchema.safeParse({ ...ok, sources: ['not a url'] }).success).toBe(false)
  })
  it('accepts every exchange enum member', () => {
    for (const ex of EXCHANGES) {
      expect(createSchema.safeParse({ ...ok, exchange: ex }).success).toBe(true)
    }
    expect(createSchema.safeParse({ ...ok, exchange: 'LSE' }).success).toBe(false)
  })
})

describe('patchSchema', () => {
  it('allows an empty patch (the API layer rejects it with 400)', () => {
    expect(patchSchema.parse({})).toEqual({})
  })
  it('accepts status and correction_note', () => {
    const p = patchSchema.parse({ status: 'retracted', correction_note: null })
    expect(p.status).toBe('retracted')
    expect(p.correction_note).toBeNull()
  })
  it('rejects unknown fields (strict mode)', () => {
    expect(patchSchema.safeParse({ surprise: 1 }).success).toBe(false)
  })
  it('leaves unspecified fields untouched (no reset on PATCH)', () => {
    const p = patchSchema.parse({ excerpt: 'Completely new excerpt text.' })
    expect(Object.keys(p)).toEqual(['excerpt'])
  })
})

describe('deleteSchema', () => {
  it('accepts {} or a bounded correction_note', () => {
    expect(deleteSchema.parse({})).toEqual({})
    expect(deleteSchema.parse({ correction_note: 'x'.repeat(2000) }).correction_note).toHaveLength(2000)
    expect(deleteSchema.safeParse({ correction_note: 'x'.repeat(2001) }).success).toBe(false)
  })
})

describe('listQuerySchema', () => {
  it('applies page/per_page defaults', () => {
    const p = listQuerySchema.parse({})
    expect(p.page).toBe(1)
    expect(p.per_page).toBe(20)
  })
  it('coerces string numbers and enforces bounds', () => {
    const p = listQuerySchema.parse({ page: '3', per_page: '50' })
    expect(p.page).toBe(3)
    expect(p.per_page).toBe(50)
    expect(listQuerySchema.safeParse({ per_page: '101' }).success).toBe(false)
    expect(listQuerySchema.safeParse({ page: '0' }).success).toBe(false)
  })
  it('rejects invalid enum values', () => {
    expect(listQuerySchema.safeParse({ category: 'stocks' }).success).toBe(false)
  })
})