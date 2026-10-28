import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

const err = { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
const ref = { name: 'ref', in: 'path', required: true, schema: { type: 'string' }, description: 'Post id or slug' }
const secured = [{ bearer: [] }]

export const spec = {
  openapi: '3.1.0',
  info: { title: 'FrontierCap API', version: '1.0.0', description: 'Private API for the research agent. All endpoints except /health need a Bearer key.' },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} } } } },
      Metric: { type: 'object', required: ['label', 'value'], properties: { label: { type: 'string' }, value: { type: ['string', 'number'] }, delta: { type: ['string', 'number', 'null'] }, delta_pct: { type: ['number', 'null'] }, unit: { type: ['string', 'null'] }, note: { type: ['string', 'null'] } } },
      PostInput: {
        type: 'object',
        required: ['title', 'category', 'excerpt', 'body_md'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 5, maxLength: 200 },
          category: { enum: ['market_wrap', 'equity_analysis', 'news_brief', 'macro_radar'] },
          exchange: { enum: ['NGX', 'GSE', 'NSE', null] },
          tickers: { type: 'array', items: { type: 'string' }, description: 'SYMBOL or EXCHANGE:SYMBOL' },
          tags: { type: 'array', items: { type: 'string' } },
          excerpt: { type: 'string', minLength: 10, maxLength: 500 },
          body_md: { type: 'string', description: 'GitHub-flavoured Markdown, max 200KB. Raw HTML is not rendered.' },
          metrics: { type: ['array', 'null'], items: { $ref: '#/components/schemas/Metric' } },
          sentiment: { enum: ['positive', 'neutral', 'negative', null] },
          sources: { type: 'array', items: { type: 'string', format: 'uri' } },
          as_of: { type: ['string', 'null'], format: 'date-time' },
          published_at: { type: ['string', 'null'], format: 'date-time' },
          client_ref: { type: ['string', 'null'], description: 'Idempotency key' },
        },
      },
    },
  },
  paths: {
    '/health': { get: { summary: 'Health check (no auth)', responses: { 200: { description: '{ok:true, db:"up"}' }, 503: { description: '{ok:false, db:"down"}' } } } },
    '/posts': {
      post: { summary: 'Create and publish a post', security: secured, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PostInput' } } } }, responses: { 201: { description: 'Created: {id, slug, status, url}' }, 200: { description: 'client_ref already exists: same shape plus idempotent_replay' }, 400: err, 401: err, 429: err } },
      get: { summary: 'List posts', security: secured, parameters: ['category', 'exchange', 'ticker', 'tag', 'status', 'from', 'to', 'page', 'per_page'].map((n) => ({ name: n, in: 'query', schema: { type: 'string' } })), responses: { 200: { description: '{data, page, per_page, total}' } } },
    },
    '/posts/{ref}': {
      get: { summary: 'Get one post', security: secured, parameters: [ref], responses: { 200: { description: 'Post' }, 404: err } },
      patch: { summary: 'Partial update (a title change regenerates the slug; the old URL redirects)', security: secured, parameters: [ref], responses: { 200: { description: 'Updated post' }, 404: err } },
      delete: { summary: 'Retract (soft delete) with optional {correction_note}', security: secured, parameters: [ref], responses: { 200: { description: 'Retracted post' }, 404: err } },
    },
    '/media': { post: { summary: 'Upload an image (multipart field "file", JPEG/PNG/WebP, max 4MB)', security: secured, responses: { 201: { description: '{url}' }, 413: err, 415: err } } },
  },
}

export function GET() {
  return NextResponse.json(spec)
}
