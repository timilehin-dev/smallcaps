# FrontierCap — Final Report (Phase E)

Date: 2026-10-28. Scope: build audit against FRONTIERCAP_AGENT_INSTRUCTIONS.md acceptance
criteria, deviations, risks, and pre-launch checklist. Live site at time of writing:
https://smallcaps-nine.vercel.app (commit f6d94d8).

## 1. Acceptance criteria status

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | POST 201, visible on site within ~60s | PASS | Seeded 3 sample posts; home/`/feed.xml`/`/search-index.json` updated within the 60s ISR window (`revalidatePath('/', 'layout')` on every write). |
| 2 | client_ref idempotency: replay -> 200, same id, no duplicate | PASS | Integration test (live Neon) + live smoke (`replay same client_ref -> 200, same id`). |
| 3 | Filters (category/exchange/ticker/tag/status/dates/pagination) | PASS | Unit tests on `listQuerySchema` + `listPosts` in integration suite. |
| 4 | PATCH live updates (no field reset) | PASS | "PATCH without a title leaves slug, exchange, tickers untouched" (integration). |
| 5 | DELETE = retract: banner + excluded from home/RSS/sitemap/search | PASS | "retract soft-deletes" + "excludes retracted posts from the public index" (integration); retracted post page renders `role="alert"` banner + noindex. |
| 6 | feed/sitemap/robots/JSON-LD/OG valid | PASS (with one regression found+fixed) | All routes live-verified. Regression: Phase E `sitemap.ts` rewrite dropped post+ticker URLs; fixed in f6d94d8 (restored custom route). Live sitemap now lists posts + tickers. |
| 7 | Media URL renders in post | PASS (by construction) | `Markdown` component renders images only from our Blob host (`*.public.blob.vercel-storage.com`); media route enforces 4MB + type sniffing. Not exercised in smoke (no image upload in this session) - see open items. |
| 8 | 401/429/health checks | PASS | Live: 401 unauthorized / 401 invalid_api_key / health 200. 429 verified with a concurrent 65-request burst (local, shared Neon/Upstash): 429s returned with `Retry-After`. |
| 9 | 3 fictional sample posts tagged `sample` | PASS | `scripts/seed.mjs` created 3 sample posts (KwikPay/GSE-wrap/NSE-brief), all tagged `sample`, all marked fictional. REQUIRES RETRACTION before public launch. |
| + | 20 identical client_ref POSTs in parallel -> exactly one row | PASS | Integration test: exactly 1 `created:true`, exactly 1 DB row. |

## 2. Test and build status

- `npx tsc --noEmit`: clean.
- `npx vitest run`: 60/60 passing (unit: slug, tickers, auth, schemas, api error contract,
  OpenAPI<->zod contract; integration vs live Neon dev branch: idempotency, concurrency,
  redirects, soft-delete, PATCH semantics, retracted exclusions).
- `next build`: passes (P2028 retry hardening in place; 15 static + 5 dynamic routes).
- GitHub CI (`.github/workflows/ci.yml`, added by parallel Phase D/E work): postgres:17
  service + `prisma generate`/`migrate deploy`/`typecheck`/`test`/`build`. Not observed
  from this environment (no gh CLI); check runs on github.com/timilehin-dev/smallcaps.
- `scripts/smoke.mjs` full authenticated flow: PASS (run via local dev server against the
  shared Neon DB).

## 3. Deviations from the original instructions

1. **Prisma 7 error codes under the pg adapter** - P2028/P2002 detection uses a fallback
   message match (`/unique constraint/i`) in addition to code checks, because the pg
   adapter can surface codes differently. Documented in `docs/TOOLING.md`.
2. **EXCHANGE:SYMBOL tickers** - stored normalized, GIN-indexed; bare symbols require a
   post-level `exchange` or are rejected with 400.
3. **PostRedirect table** - added to support slug changes on title edits (spec had no
   redirect requirement; required for correct behaviour).
4. **sources/asOf fields** - added to Post model beyond the original spec.
5. **4MB media cap** - Vercel function body limit (~4.5MB); enforced in the media route.
6. **No CORS** - API is consumed by the research agent only; intentional.
7. **Upstash rate limiting** - 60/min sliding window per key; in-memory fallback locally;
   fail-open on backend outage (documented trade-off: a Redis outage cannot take the API
   down, but the limit is per-instance when the fallback is active).
8. **/openapi.json** served publicly - drift-guarded by `openapi.contract.test.ts`.
9. **Datasource URL in prisma.config.ts** - Prisma 7 convention; schema.prisma holds no
   URL.
10. **sitemap/robots as custom routes, not Next metadata conventions** - Phase E
    `sitemap.ts`/`robots.ts` conventions silently dropped post+ticker sitemap URLs;
    f6d94d8 restored the custom routes which are the verified-correct implementation.
11. **P2028 retry** - not in the original spec; added because `next build` (7 static-gen
    workers) + ISR bursts against Neon's shared pooler cause transaction-start timeouts.
    Budget hardened in the final change (6 attempts, 200ms*2^n backoff).

## 4. Findings and open risks

- **Under load, list queries can 500 (P2028)**. A 65-way concurrent burst produced
  ~60 x 500 (10s each = P2028 transaction-start timeouts) plus 5 x 429. The hardened
  retry budget covers the typical case, but truly heavy bursts will still surface 500s
  on list endpoints. Mitigations if it recurs in production: Neon pooled-connection
  scale-up, or a short-lived read cache on the hot list queries. Acceptable at agent
  traffic volumes (60/min/key rate limit).
- **Rate limit verified against Upstash** (ping + sliding-window probe + live 429 with
  Retry-After). The limiter is shared across instances in production; the in-memory
  fallback is per-instance only (local dev).
- **Vercel deploy log warnings** (non-blocking, all cosmetic/config):
  - `engines: node >=22` auto-upgrades to future majors - pin the Node version before
    launch.
  - Vercel `allowScripts` gates postinstall scripts for prisma/esbuild (build still
    succeeds; add an allow-list entry when Vercel ships the config UI).
  - npm `cache-dir` unknown-config warning (Vercel-side).
  - pg SSL-mode alias warning (Neon self-signed chain; harmless).
- **Hobby plan** - Vercel Hobby is documented as non-commercial. Monetisation (ads,
  subscriptions) requires a paid plan.
- **Local `.env`** contains the local dev API_KEY only (44-char random). Production key
  lives in Vercel env vars. No secrets were committed; `.env` is gitignored.
- **The empty nested `frontiercap\frontiercap` directory** remains locked by the agent
  session's working directory; it contains no files and clears on session reset.

## 5. SECURITY - REQUIRED ACTIONS BEFORE PUBLIC LAUNCH

1. **REVOKE / ROTATE all credentials that were pasted into the agent chat**:
   - Neon database password (`npg_yCBMAqm6wZT8`) - reset in Neon dashboard, update
     Vercel `DATABASE_URL`/`DIRECT_URL`.
   - Upstash Redis token (`gQAAAA...`) - rotate in Upstash/Vercel dashboard, update
     `KV_REST_API_URL`/`KV_REST_API_TOKEN`.
   - Vercel Blob read-write token (`vercel_blob_rw_...`) - rotate, update
     `BLOB_READ_WRITE_TOKEN`.
   - `API_KEY` (generated in-chat, 64-hex) - rotate via `API_KEY_ROTATION` zero-downtime
     procedure in `docs/DEPLOY.md` step 5 after the first production use.
2. **Retract the 3 sample posts** (`sample-kwipay`, `sample-gse-wrap`, `sample-nse-brief`)
   before the site is announced: `PATCH /api/v1/posts/<ref> {status:'retracted'}` or the
   DELETE (soft-delete) endpoint.
3. **Legal review** - `/disclaimer` and the AI-authored-research disclosure should be
   reviewed by a local lawyer (flag, not legal advice).
4. **Google Search Console** - verify domain post-launch, submit `/sitemap.xml`.
5. **Pin the Node.js version** in Vercel project settings before launch.
6. **Set `SITE_URL`** in Vercel env vars to the production origin (canonical/RSS/sitemap
   URLs fall back to the Vercel hostname, which works but is not clean).

## 6. Reproduce

```bash
npm install                     # also runs prisma generate (postinstall)
npx tsc --noEmit
npx vitest run                  # 60 tests; integration suite skips without DATABASE_URL
BASE_URL=https://smallcaps-nine.vercel.app API_KEY=... npm run smoke
BASE_URL=... API_KEY=... npm run seed
```