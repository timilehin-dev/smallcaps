#!/usr/bin/env node
// FrontierCap smoke test (acceptance checks 8-9 + write-flow sanity).
// Usage:  BASE_URL=https://<your-project>.vercel.app API_KEY=... node scripts/smoke.mjs
// Exits 0 when every check passes, 1 otherwise.

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const KEY = process.env.API_KEY ?? ''
const ref = 'smoke-' + Date.now()

let failed = 0
function ok(name, cond, extra) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  [' + extra + ']' : ''))
  if (!cond) failed++
}
async function api(method, path, { body, key } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(key ? { authorization: 'Bearer ' + key } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data = null
  try { data = await res.json() } catch { /* non-JSON */ }
  return { status: res.status, data, headers: res.headers }
}

const post = {
  title: 'Smoke test: fictional small-cap headline',
  category: 'news_brief',
  excerpt: 'Automated smoke-test post. Illustrative only, not research.',
  body_md: '# Smoke\n\nCreated and retracted by `npm run smoke`.\n',
  exchange: 'NGX',
  tickers: ['NGX:SMK'],
  tags: ['smoke'],
  client_ref: ref,
}

const h = await api('GET', '/api/v1/health')
ok('GET /api/v1/health -> 200', h.status === 200, h.status + ' ' + (h.data?.status ?? ''))

const home = await api('GET', '/')
ok('GET / -> 200', home.status === 200, home.status + '')

const noAuth = await api('POST', '/api/v1/posts', { body: post })
ok('POST without key -> 401 unauthorized', noAuth.status === 401, noAuth.data?.error?.code ?? '')

const badKey = await api('POST', '/api/v1/posts', { body: post, key: 'x'.repeat(48) })
ok('POST with wrong key -> 401 invalid_api_key', badKey.status === 401, badKey.data?.error?.code ?? '')

if (!KEY) {
  console.log('SKIP authenticated checks (API_KEY not provided)')
  process.exit(failed ? 1 : 0)
}

const created = await api('POST', '/api/v1/posts', { body: post, key: KEY })
ok('POST with key -> 201', created.status === 201, created.status + ' ' + (created.data?.error?.code ?? ''))
const id = created.data?.id

const replay = await api('POST', '/api/v1/posts', { body: post, key: KEY })
ok('replay same client_ref -> 200, same id', replay.status === 200 && replay.data?.id === id, replay.status + '')

const got = await api('GET', '/api/v1/posts/' + id, { key: KEY })
ok('GET post -> 200', got.status === 200 && got.data?.id === id, got.status + '')

const patched = await api('PATCH', '/api/v1/posts/' + id, { body: { sentiment: 'neutral' }, key: KEY })
ok('PATCH post -> 200, sentiment set', patched.status === 200 && patched.data?.sentiment === 'neutral', patched.status + '')

const del = await api('DELETE', '/api/v1/posts/' + id, { body: { correction_note: 'smoke test cleanup' }, key: KEY })
ok('DELETE (retract) -> 200, status retracted', del.status === 200 && del.data?.status === 'retracted', del.status + ' ' + (del.data?.status ?? del.data?.error?.code ?? ''))

const listed = await api('GET', '/api/v1/posts?per_page=5', { key: KEY })
ok('GET list -> 200 with data[]/total', listed.status === 200 && Array.isArray(listed.data?.data) && Number.isInteger(listed.data?.total), listed.status + '')

const rf = await api('GET', '/api/v1/posts/' + id, { key: KEY })
ok('retracted post still retrievable by id (soft delete)', rf.status === 200 && rf.data?.status === 'retracted', rf.status + '')

console.log(failed ? 'SMOKE FAILED (' + failed + ' check(s))' : 'SMOKE OK - all checks passed')
process.exit(failed ? 1 : 0)