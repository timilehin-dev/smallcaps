#!/usr/bin/env node
// Seeds three FICTIONAL sample posts through the public API (idempotent: fixed client_refs).
// Usage:  BASE_URL=... API_KEY=... node scripts/seed.mjs
// WARNING: these are illustrative placeholders, NOT research findings.
// They must be retracted before the site is announced publicly.

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const KEY = process.env.API_KEY ?? ''
if (!KEY) {
  console.error('API_KEY is required. Set it and retry.')
  process.exit(1)
}

const samples = [
  {
    title: 'Fictional: KwikPay (NGX:KWPY) first-quarter review',
    category: 'equity_analysis',
    exchange: 'NGX',
    tickers: ['NGX:KWPY'],
    tags: ['sample', 'fintech'],
    excerpt: 'Illustrative sample post - all figures are fictional.',
    body_md:
      '# KwikPay Q1 (illustrative)\n\n' +
      'This is a **fictional sample post** used only to demonstrate the site layout, metrics table, and ticker chips. None of the numbers below are real research findings.\n\n' +
      '## What the layout shows\n\n' +
      '| Line item | Sample value |\n' +
      '| --- | --- |\n' +
      '| Merchant volume | 1,240 (fictional) |\n' +
      '| Take rate | 1.8% (fictional) |\n\n' +
      '> Sample disclaimer: content tagged "sample" is placeholder material.\n',
    metrics: [
      { label: 'Revenue', value: '4.8bn', delta: '+0.4bn', delta_pct: 9.1, unit: 'NGN', note: 'Fictional data only' },
      { label: 'Operating margin', value: '18.2', delta: '-1.1', delta_pct: -5.7, unit: '%', note: 'Fictional data only' },
      { label: 'Active merchants', value: '312k', delta: '+28k', delta_pct: 9.9, note: 'Fictional data only' },
    ],
    sentiment: 'neutral',
    sources: ['https://example.com/fictional-source-one', 'https://example.com/fictional-source-two'],
    as_of: '2026-10-24T00:00:00.000Z',
    client_ref: 'sample-kwipay',
  },
  {
    title: 'Fictional: GSE market wrap - sample week',
    category: 'market_wrap',
    exchange: 'GSE',
    tickers: ['GSE:INDEX'],
    tags: ['sample', 'markets'],
    excerpt: 'Illustrative sample wrap - not actual market data.',
    body_md:
      '# GSE wrap (illustrative)\n\n' +
      'A fictional market wrap that exists purely to show the market_wrap category layout. No real index values are referenced.\n\n' +
      '- **Breadth**: 12 advancing / 9 declining (fictional)\n' +
      '- **Volume leaders**: two invented tickers\n',
    metrics: [
      { label: 'GSE Composite (sample)', value: '3,104.2', delta: '+21.7', delta_pct: 0.7, note: 'Fictional index level' },
      { label: 'Value traded', value: '38.6m', delta: '-4.2m', delta_pct: -9.8, unit: 'GHS', note: 'Fictional data only' },
    ],
    sentiment: 'positive',
    sources: ['https://example.com/fictional-gse-reference'],
    as_of: '2026-10-23T00:00:00.000Z',
    client_ref: 'sample-gse-wrap',
  },
  {
    title: 'Fictional: NSE news brief - sample listing note',
    category: 'news_brief',
    exchange: 'NSE',
    tickers: ['NSE:SMCA'],
    tags: ['sample', 'news'],
    excerpt: 'Illustrative sample brief - not real news.',
    body_md:
      '# News brief (illustrative)\n\n' +
      'A fictional news brief for Nairobi Securities Exchange layout demo purposes only. It is not an investment recommendation.\n\n' +
      '**Why this sample exists**: to show how a short brief renders with ticker chips and the AI-assisted label.\n',
    metrics: [
      { label: 'Price (sample)', value: '17.40', delta: '+0.35', delta_pct: 2.1, unit: 'KES', note: 'Fictional quote' },
    ],
    sentiment: 'neutral',
    sources: ['https://example.com/fictional-nse-notice'],
    as_of: '2026-10-27T00:00:00.000Z',
    client_ref: 'sample-nse-brief',
  },
]

for (const s of samples) {
  const res = await fetch(BASE + '/api/v1/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + KEY },
    body: JSON.stringify(s),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    console.log('FAIL  ' + s.client_ref + ' -> ' + res.status + '  ' + (data?.error?.code ?? ''))
    process.exit(1)
  }
  if (res.status === 201) {
    console.log('OK    ' + s.client_ref + ' -> 201 created  ' + data.slug)
    continue
  }
  // 200 means this client_ref already exists: refresh its content so re-seeding
  // picks up edits to this file instead of leaving stale sample copy behind.
  const { client_ref: _drop, ...patch } = s
  const upd = await fetch(BASE + '/api/v1/posts/' + data.id, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + KEY },
    body: JSON.stringify({ ...patch, status: 'published' }),
  })
  const ubody = await upd.json().catch(() => null)
  console.log(
    (upd.ok ? 'OK    ' : 'FAIL  ') + s.client_ref + ' -> ' + upd.status + ' refreshed  ' + (ubody?.slug ?? ubody?.error?.code ?? ''),
  )
  if (!upd.ok) process.exit(1)
}
console.log('Seeding complete. Remember: all three posts are tagged "sample" - retract them before public launch.')