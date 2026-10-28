# FrontierCap

Editorial platform publishing independent small-cap equity research and daily market
intelligence for three African exchanges: **NGX** (Nigeria), **GSE** (Ghana) and **NSE**
(Kenya).

Two halves:

1. A public, SEO-first content site (Next.js App Router, ISR).
2. A private REST API (`/api/v1`) used by an automated LLM research agent to create, update
   and retract posts with no human in a CMS. **This is the primary deliverable.**

Posts publish instantly. There is no approval queue; a retraction/correction flow replaces a
review gate.

> ⚠️ **Content notice.** Any post tagged `sample` is placeholder material with fictional
> companies and figures. Retract the seeded samples before public launch.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) + TypeScript |
| Rendering | ISR (`revalidate = 60`) + on-demand `revalidatePath` after every API write |
| Database | PostgreSQL on Neon, via Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) |
| Styling | Tailwind CSS 4 + `@tailwindcss/typography` |
| Validation | zod 4 (strict objects) |
| Markdown | react-markdown + remark-gfm (GFM tables), raw HTML disabled |
| Media | Vercel Blob |
| Rate limiting | Upstash Redis sliding window (in-memory fallback for local dev) |
| Hosting | Vercel |

---

## Quick start (local)

```bash
npm install                 # runs `prisma generate` via postinstall
cp .env.example .env.local  # then fill in the values below
npx prisma migrate deploy   # apply migrations to your database
npm run dev                 # http://localhost:3000
```

### Required environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Pooled Postgres connection string (runtime). |
| `DIRECT_URL` / `DATABASE_URL_UNPOOLED` | yes (migrations) | Unpooled string. Prisma Migrate uses this. |
| `API_KEY` | yes | Bearer key for the API. **≥ 40 characters.** |
| `API_KEY_ROTATION` | no | Second accepted key for zero-downtime rotation. |
| `BLOB_READ_WRITE_TOKEN` | for `/media` | Vercel Blob token. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | recommended in prod | Shared rate limiter. Also reads `KV_REST_API_URL` / `KV_REST_API_TOKEN`. |
| `SITE_URL` | no | Public origin, no trailing slash. Falls back to `VERCEL_PROJECT_PRODUCTION_URL`. |

Generate a key locally with:

```bash
openssl rand -hex 32
```

Never commit `.env*` (except `.env.example`). The repo `.gitignore` already excludes them.

---

## API v1

Base path: `/api/v1`. Every endpoint except `/health` requires:

```
Authorization: Bearer $API_KEY
```

All errors use one shape:

```json
{ "error": { "code": "validation_error", "message": "…", "details": [] } }
```

Every response carries an `X-Request-Id` header. Rate limit: **60 requests/minute per key**;
the 429 carries `Retry-After`. Request JSON is capped at 300 KB, `body_md` at 200 KB.

Set up a shell for the examples below:

```bash
export BASE=https://your-project.vercel.app
export API_KEY=...        # the key you set in Vercel
```

### `GET /health` (no auth)

```bash
curl -s $BASE/api/v1/health
# {"ok":true,"db":"up"}    200  (503 with {"ok":false,"db":"down"} when the DB is unreachable)
```

### `POST /posts` — create and publish

Body: `{title, category, exchange?, tickers?, tags?, excerpt, body_md, metrics?, sentiment?,
sources?, as_of?, published_at?, client_ref?}`. Unknown fields are **rejected** (strict).

```bash
cat > post.json <<'JSON'
{
  "title": "Fictional: KwikPay (NGX:KWPY) first-quarter review",
  "category": "equity_analysis",
  "exchange": "NGX",
  "tickers": ["KWPY", "NGX:GTCO"],
  "tags": ["sample", "fintech"],
  "excerpt": "Illustrative sample post - all figures are fictional.",
  "body_md": "# KwikPay Q1 (illustrative)\n\nA **fictional** sample post.\n\n| Metric | Value |\n|---|---|\n| EPS | 1.23 |\n",
  "metrics": [{ "label": "P/E", "value": 4.2, "delta": 0.3, "delta_pct": 7.7, "unit": "x", "note": "fictional" }],
  "sentiment": "positive",
  "sources": ["https://example.com/sample"],
  "as_of": "2026-10-20T00:00:00Z",
  "client_ref": "agent-run-2026-10-20-kwpy"
}
JSON

curl -s -X POST $BASE/api/v1/posts \
  -H "Authorization: Bearer $API_KEY" -H 'Content-Type: application/json' \
  -d @post.json
# 201 {"id":"…","slug":"…","status":"published","url":"https://…/posts/…"}
```

- Slug = kebab(title) + `-YYYY-MM-DD`. On collision a short random suffix is appended
  (retry on unique violation; never check-then-insert).
- **Idempotency:** resending the same `client_ref` returns **200** with the same `id` and an
  `Idempotent-Replay: true` header — no duplicate row, even under concurrent requests.
- Tickers: pass `SYMBOL` (the post's `exchange` is applied) or `EXCHANGE:SYMBOL`. Bare
  symbols with no `exchange` → **400**.

### `GET /posts` — list

Filters: `category`, `exchange`, `ticker`, `tag`, `status`, `from`, `to`, `page`,
`per_page` (default 20, max 100). Newest first.

```bash
curl -s "$BASE/api/v1/posts?category=market_wrap&exchange=NGX&per_page=5" \
  -H "Authorization: Bearer $API_KEY"
# {"data":[…],"page":1,"per_page":5,"total":…}
```

### `GET /posts/:ref` — fetch one

`ref` is a slug **or** an id. Retracted posts are returned too.

```bash
curl -s "$BASE/api/v1/posts/my-post-slug-2026-10-20" -H "Authorization: Bearer $API_KEY"
```

### `PATCH /posts/:ref` — partial update

Any field except `id` and `client_ref`. Changing the `title` regenerates the slug and records
a redirect from the old one (old URLs keep working via 308).

```bash
curl -s -X PATCH "$BASE/api/v1/posts/my-post-slug-2026-10-20" \
  -H "Authorization: Bearer $API_KEY" -H 'Content-Type: application/json' \
  -d '{"body_md":"# Corrected\n\nUpdated body.","sentiment":"neutral"}'
```

### `DELETE /posts/:ref` — retract (soft delete)

Sets `status = "retracted"`. The post stays at its URL behind a prominent correction banner,
is marked `noindex`, and is excluded from the feed, sitemap, homepage and section/ticker
lists.

```bash
curl -s -X DELETE "$BASE/api/v1/posts/my-post-slug-2026-10-20" \
  -H "Authorization: Bearer $API_KEY" -H 'Content-Type: application/json' \
  -d '{"correction_note":"Figures restated; see replacement post."}'
```

### `POST /media` — upload an image

`multipart/form-data`, field `file`. JPEG / PNG / WebP, validated by **magic bytes**, max
**4 MB** (Vercel rejects request bodies above ~4.5 MB).

```bash
curl -s -X POST $BASE/api/v1/media \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@chart.png"
# 201 {"url":"https://…public.blob.vercel-storage.com/media/…"}
```

Reference the returned URL in `body_md`. Only Blob-hosted images render (other `<img>`
sources degrade to their alt text).

### `GET /openapi.json`

Machine-readable OpenAPI 3.1 document for the whole API.

---

## Key rotation

Set `API_KEY_ROTATION` to the new key, deploy, switch the agent over, then promote it to
`API_KEY` and clear the rotation variable. Both keys are accepted while both are set; keys
are compared as SHA-256 digests in constant time and never logged.

---

## Operations

- **Backups:** Neon provides point-in-time restore. Use it to recover from a bad write.
- **Branching:** use a Neon `dev` branch for local work and migration rehearsal; run
  `prisma migrate dev` there before touching production.
- **Build order:** `next build` prerenders the section pages, which query the database. The
  `DATABASE_URL` must exist before the first deploy, otherwise the build fails. The
  `vercel-build` script runs `prisma generate && prisma migrate deploy && next build`.

## Tests

```bash
npm test          # vitest: unit + integration (integration skips without DATABASE_URL)
npm run typecheck
npm run smoke     # acceptance checks against a running instance
npm run seed      # seed the three sample posts
```

`scripts/smoke.mjs` needs `BASE_URL` and `API_KEY`; `scripts/seed.mjs` needs the same.

---

## Deviations from the original brief

Recorded in full in the final report. Summary: Prisma enums for
category/exchange/sentiment/status; tickers stored as `EXCHANGE:SYMBOL`; a `PostRedirect`
table for old slugs; extra `sources` and `asOf` fields; a 4 MB (not 5 MB) media cap; no CORS
headers; Upstash rate limiting with an in-memory dev fallback; a served `/openapi.json`; and
the datasource URL living in `prisma.config.ts` rather than `schema.prisma`.

## Legal

The compliance footer is auto-appended to every post. **Have a local lawyer review the
disclaimer and the AI-authored-research disclosure** before launch; securities regulators in
Nigeria, Ghana and Kenya may have rules on publishing research. This is a flag, not legal
advice. Vercel's Hobby plan is generally limited to non-commercial use.
