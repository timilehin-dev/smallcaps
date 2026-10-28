import { z } from 'zod'

export const CATEGORIES = ['market_wrap', 'equity_analysis', 'news_brief', 'macro_radar'] as const
export const EXCHANGES = ['NGX', 'GSE', 'NSE'] as const
export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const
export const STATUSES = ['published', 'retracted'] as const

export type Category = (typeof CATEGORIES)[number]
export type Exchange = (typeof EXCHANGES)[number]
export type PostStatus = (typeof STATUSES)[number]

export const MAX_BODY_BYTES = 200 * 1024

const metric = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.union([z.string().max(120), z.number()]),
  delta: z.union([z.string().max(60), z.number()]).nullish(),
  delta_pct: z.number().nullish(),
  unit: z.string().max(30).nullish(),
  note: z.string().max(300).nullish(),
})

const ticker = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .regex(/^([A-Za-z]{3}:)?[A-Za-z0-9.\-]+$/, 'Use SYMBOL or EXCHANGE:SYMBOL')

const bodyMd = z
  .string()
  .min(1)
  .refine((s) => Buffer.byteLength(s, 'utf8') <= MAX_BODY_BYTES, 'body_md exceeds 200KB')

// No defaults inside these shapes: .partial() + defaults would overwrite fields on PATCH.
const shape = {
  title: z.string().trim().min(5).max(200),
  category: z.enum(CATEGORIES),
  exchange: z.enum(EXCHANGES).nullish(),
  tickers: z.array(ticker).max(20),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  excerpt: z.string().trim().min(10).max(500),
  body_md: bodyMd,
  metrics: z.array(metric).max(40).nullish(),
  sentiment: z.enum(SENTIMENTS).nullish(),
  sources: z.array(z.url().max(500)).max(30),
  as_of: z.coerce.date().nullish(),
  published_at: z.coerce.date(),
}

export const createSchema = z
  .object({
    title: shape.title,
    category: shape.category,
    excerpt: shape.excerpt,
    body_md: shape.body_md,
    exchange: shape.exchange,
    tickers: shape.tickers.optional(),
    tags: shape.tags.optional(),
    metrics: shape.metrics,
    sentiment: shape.sentiment,
    sources: shape.sources.optional(),
    as_of: shape.as_of,
    published_at: shape.published_at.nullish(),
    client_ref: z.string().trim().min(1).max(120).nullish(),
  })
  .strict()

export const patchSchema = z
  .object({
    ...shape,
    published_at: shape.published_at,
    status: z.enum(STATUSES),
    correction_note: z.string().trim().max(2000).nullable(),
  })
  .partial()
  .strict()

export const deleteSchema = z
  .object({ correction_note: z.string().trim().min(1).max(2000).optional() })
  .strict()

export const listQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  exchange: z.enum(EXCHANGES).optional(),
  ticker: ticker.optional(),
  tag: z.string().trim().min(1).max(40).optional(),
  status: z.enum(STATUSES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateInput = z.infer<typeof createSchema>
export type PatchInput = z.infer<typeof patchSchema>
export type ListQuery = z.infer<typeof listQuerySchema>
