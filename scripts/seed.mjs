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
      '> Sample disclaimer: content tagged "sample" is placeholder material.',
    metrics: [
      { label: 'Market cap (sample)', value: 'n/a', note: 'Fictional data only' },
      { label: 'Sample growth', value: 0, delta_pct: 0, unit: '%' },
    ],
    sentiment: 'neutral',
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
      'A fictional market wrap that exists purely to show the market_wrap category layout. No real index values are referenced.',
    sentiment: 'neutral',
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
      'A fictional news brief for Nairobi Securities Exchange layout demo purposes only. It is not an investment recommendation.',
    sentiment: 'neutral',
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
  console.log((res.ok ? 'OK  ' : 'FAIL') + '  ' + s.client_ref + ' -> ' + res.status + '  ' + (data?.slug ?? data?.error?.code ?? ''))
  if (!res.ok) process.exit(1)
}
console.log('Seeding complete. Remember: all three posts are tagged "sample" - retract them before public launch.')