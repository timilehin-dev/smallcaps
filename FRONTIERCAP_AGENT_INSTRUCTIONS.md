# FrontierCap — Build Instructions for the Coding Agent

Paste this whole file to the agent as its task (or save it in the repo root and tell the agent to follow it). A partially built project (`frontiercap-wip.zip`) accompanies it. Treat that code as a **reviewed draft, not finished work**: it was type-checked but never run, built or tested.

---

## 0. Mission

Build and deploy **FrontierCap**: an editorial platform publishing independent small-cap equity research and daily market intelligence for three African exchanges: **NGX** (Nigeria), **GSE** (Ghana), **NSE** (Kenya).

Two halves:
1. A **public content site**: fast, SEO-first, editorial reading experience.
2. A **private REST API** used by an automated LLM research agent to create, update and retract posts with no human in a CMS. **The API is the most important deliverable.** It must be production-grade, documented and testable with curl.

Posts publish instantly (no approval queue). A retraction/correction flow replaces a review gate.

**Priority if time-constrained:** API → post rendering → SEO → everything else.

The owner (Timilehin) will iterate on visual design with you *after* v1 ships. Keep v1 design clean and credible but do not invest in branding or illustrations.

---

## 1. Ground rules

- **Never print, log, commit or echo secrets** (API keys, DB URLs, tokens). Use env vars. `.env*` is gitignored except `.env.example`.
- **Do not generate the production `API_KEY` yourself and display it.** Tell the owner to run `openssl rand -hex 32` and set it in Vercel's dashboard. For local tests use a throwaway key kept only in an untracked `.env.local`.
- Any token the owner gives you is temporary and will be revoked when done. Use the least scope needed.
- Do not substitute the stack (section 4) without owner approval. Pin versions; verify they exist with `npm view <pkg> version` before installing.
- Work on a branch per phase; open a PR or commit to `main` only when the phase's checks pass. Commit often with clear messages.
- Be honest in reports: say what you ran and what you did not.
- Do not present invented market data as real. Sample posts must use fictional companies and be clearly labelled as samples.

---

## 2. Skills, plugins and MCP servers: find, install or create

Before writing code, **inventory what your environment offers** and install what is missing. Search by the names and keywords below. If something is unavailable in your harness, **create an equivalent project-local playbook** (a `docs/playbooks/<topic>.md` or a SKILL.md, whichever your tool supports) with the same checklist, and follow it. Do this especially for backend engineering discipline and frontend/design quality.

### 2.1 MCP / connectors (connect or use CLI equivalents)
| Need | What to use |
|---|---|
| Git hosting | **GitHub MCP** (repo `timilehin-dev/smallcaps`, public, currently empty, default branch `main`). Needs **write** access (Contents: read/write) or use plain `git` + the owner's credentials. |
| Database | **Neon MCP** (or `neonctl`): create the project, a `dev` branch for local work, run SQL, compare schemas. |
| Hosting | **Vercel MCP** (read: projects, deployments, build and runtime logs, docs) and/or **Vercel CLI** (`vercel link`, `vercel env`, `vercel deploy`). The Vercel MCP has tools to create projects from Git and manage env vars, but verify what your harness exposes. Owner's Vercel team is on the **Hobby** plan. |
| Docs lookup | Neon docs, Vercel docs, Prisma docs, Next.js docs (use official docs search tools or MCPs if available). |

### 2.2 Backend engineering skills (the "Backend Design" plugin family): search for these names
`think-before-coding`, `design`, `audit`, `data-modeling-discipline`, `migration-safety`, `review-migration`, `query-discipline`, `explain-this-query`, `hunt-n-plus-one`, `idempotency-and-side-effects`, `error-handling-as-design`, `auth-and-authorization`, `security-discipline`, `observability-by-default`, `performance-and-scaling`, `testing-with-discernment`, `debugging-discipline`, `boring-by-default`.
How to use them: run `think-before-coding` before each backend component; apply `data-modeling-discipline` + `migration-safety` before the first migration; `idempotency-and-side-effects` and `error-handling-as-design` for the posts endpoints; `security-discipline` + `auth-and-authorization` before shipping the API; `testing-with-discernment` for the test suite; `audit` on the finished API.

### 2.3 Frontend and design skills
Search for: `frontend-design`, `design-elevation`, `web-design-system`, `design-system`, `landing-page`, `web-review` / `review-page`, `design-critique`, `accessibility-review` / `accessibility-audit`, `ux-writing` / `ux-copy`, `interaction-design`. Use the design-system skill to write a short `DESIGN.md` (tokens: one accent colour, type scale, spacing, card style, green/red delta colours, tables) **before** polishing pages. Run an accessibility audit (WCAG 2.2 AA) and a design critique on the finished pages.

### 2.4 SEO skills (SearchFit SEO family and similar)
Search for: `seo-check`, `seo-audit`, `technical-seo`, `on-page-seo`, `generate-schema` / `schema-markup`, `internal-linking`, `broken-links`, `content-brief`, `ai-visibility` (GEO). Use them for post metadata, JSON-LD, sitemap/robots, and a final audit. Also look for an **SEO + GEO site-audit** plugin to run after launch.

### 2.5 Platform skills
Search for the Neon skills (`neon`, `neon-postgres`, `neon-postgres-branches`) and any Vercel/Next.js/Prisma skills. Use Neon branching for dev and migration rehearsal.

### 2.6 API security and contract plugins (nice to have)
An **API security testing** plugin (e.g. 42Crunch-style OpenAPI audit) and an **API drift detector** (keeps Prisma schema, zod schemas, TS types and `openapi.json` in sync). If absent, write a small test that asserts the OpenAPI document and the zod schemas agree on field names and enums.

**Deliverable of this step:** a short `docs/TOOLING.md` listing which skills/plugins/MCPs you found and installed, which you created yourself, and which were unavailable.

---

## 3. Accounts and environment

Provisioning order matters:
1. **GitHub**: confirm write access to `timilehin-dev/smallcaps`. (The chat connector returned `403 Resource not accessible by integration` because the Claude GitHub app lacked write access; check yours works with a test commit.) The repo is empty, so make the first commit via the Contents API or plain `git push`.
2. **Neon**: create project `frontiercap` (region near the owner's users, e.g. Europe or US East; ask if unsure). Create a `dev` branch for local work. Collect: pooled connection string (host has `-pooler`) and direct (unpooled) string.
3. **Vercel**: create the project from the GitHub repo **with auto-deploy off until env vars exist** (the build runs migrations and the ISR pages query the DB at build time, so a first deploy without `DATABASE_URL` fails).
4. Add stores via Vercel's integrations where possible so credentials are injected, not pasted: **Neon**, **Upstash Redis**, **Blob**. Use **one** Postgres provider only (Neon); do not also add Prisma Postgres.
5. Env vars (Production + Preview): `DATABASE_URL` (pooled), `DIRECT_URL` or `DATABASE_URL_UNPOOLED` (direct), `API_KEY` (owner sets), `API_KEY_ROTATION` (optional), `BLOB_READ_WRITE_TOKEN`, `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (the code also reads `KV_REST_API_URL` / `KV_REST_API_TOKEN`), `SITE_URL` (public origin; falls back to `VERCEL_PROJECT_PRODUCTION_URL`). Integration-injected variable names differ from the spec's; **adapt the code to what actually gets injected** (`src/lib/db.ts`, `src/lib/ratelimit.ts`, `prisma.config.ts` already read common alternatives).

Plan note: Vercel Hobby is, as far as the owner's research shows, limited to non-commercial use; flag it in the final report if monetisation is planned.

---

## 4. Stack (decided)

Next.js App Router + TypeScript (ISR); PostgreSQL on Neon; Prisma ORM; Tailwind CSS; Vercel hosting; zod validation; react-markdown + remark-gfm (tables are essential). Media: Vercel Blob (R2 only if Blob is unavailable).

Versions in the scaffold (verify with `npm view`, adjust if any is wrong): Next 16.4.3, React 19.3.1, Prisma + `@prisma/client` 7.10.1 with `@prisma/adapter-pg`, zod 4.x, Tailwind 4.x + `@tailwindcss/typography`, Vitest 3.x, TypeScript ~5.9.

Prisma 7 notes: the generator is `prisma-client` with `output = ../src/generated/prisma` (gitignored; created by `postinstall`); the datasource URL lives in `prisma.config.ts`, not the schema; the client is built with the `PrismaPg` adapter (`src/lib/db.ts`, lazy so importing it never needs a DB). Import the client from `@/generated/prisma/client`. If Prisma 7 causes trouble, Prisma 6 with the classic generator is an acceptable fallback; tell the owner.

---

## 5. Product specification

### 5.1 Data model (implemented in `prisma/schema.prisma`)
`Post`: id (cuid), slug (unique), title, category, exchange?, tickers[], tags[], excerpt, bodyMd (Text), metrics (Json?), sentiment?, status (default published), correctionNote?, clientRef? (unique), publishedAt, updatedAt, plus additions: `sources String[]` (source URLs), `asOf DateTime?` (date of the underlying data). `PostRedirect(oldSlug PK, postId)` keeps old URLs alive after slug changes.
- category: `market_wrap | equity_analysis | news_brief | macro_radar`; exchange: `NGX | GSE | NSE | null`; sentiment: `positive | neutral | negative`; status: `published | retracted`. (Implemented as Prisma enums.)
- **Tickers are stored as `EXCHANGE:SYMBOL`** (e.g. `NGX:ZENITHBANK`) because symbols can collide across exchanges. The API accepts `SYMBOL` (uses the post's `exchange`) or `EXCHANGE:SYMBOL`; if neither gives an exchange, return 400.
- Indexes: `(status, publishedAt desc)`, `(category, status, publishedAt desc)`, `(exchange, status, publishedAt desc)`, GIN on tickers and tags.
- `metrics`: `[{label, value, delta, delta_pct, unit, note}]` rendered as a stat table.

### 5.2 REST API v1 (`/api/v1`, JSON)
**Auth:** every endpoint except `/health` needs `Authorization: Bearer <API_KEY>`. Key ≥ 40 chars in env `API_KEY`; optional `API_KEY_ROTATION` accepted too (zero-downtime rotation). Compare **SHA-256 digests in constant time**; never log the raw key; no keys in query strings. **No CORS headers** (the agent is server-to-server).

| Endpoint | Behaviour |
|---|---|
| `POST /posts` | Body `{title, category, exchange?, tickers?, tags?, excerpt, body_md, metrics?, sentiment?, sources?, as_of?, published_at?, client_ref?}`. Strict zod validation; unknown fields rejected. Slug = kebab(title)+`-YYYY-MM-DD`; on collision append a short suffix (retry on unique-violation, never check-then-insert). `client_ref` replay → **200** with the same post id (also under concurrent requests). Success → **201** `{id, slug, status:"published", url}`. |
| `GET /posts` | Filters `category, exchange, ticker, tag, status, from, to, page, per_page` (default 20, max 100), newest first. Returns `{data, page, per_page, total}` with full objects (snake_case). |
| `GET /posts/:ref` | `ref` = slug or id. Returns retracted posts too. |
| `PATCH /posts/:ref` | Partial update of any field except id and `client_ref`. A title change regenerates the slug and records a redirect from the old one. Returns the updated post. |
| `DELETE /posts/:ref` | Soft delete → `status=retracted`; optional body `{correction_note}`. Stays at its URL with a prominent banner; excluded from RSS, sitemap, homepage, category and ticker lists; `noindex`. |
| `POST /media` | Multipart field `file`; JPEG/PNG/WebP; validate by magic bytes. Stored in Vercel Blob; returns `{url}`. **Cap is 4 MB, not 5 MB**, because Vercel functions reject request bodies above ~4.5 MB. If a 5 MB limit is required, implement Blob client-upload tokens instead. |
| `GET /health` | No auth. `{ok:true, db:"up"}` after a real `SELECT 1`; 503 `{ok:false, db:"down"}` otherwise. |

**Error contract:** always `{error:{code, message, details?}}` with 400 validation, 401 auth, 404, 409 conflict, 413, 415, 429, 500 (generic message, no internals). **Rate limit:** 60 req/min per key, Upstash sliding window (in-memory fallback for local dev only; fail open if Redis errors); 429 with `Retry-After`. Cap `body_md` at 200 KB and request JSON at 300 KB. Every response carries `X-Request-Id`; log one structured JSON line per request (no secrets).

Also serve an **OpenAPI 3.1 document at `/openapi.json`** (scaffolded) and keep it in sync.

### 5.3 Public site
Pages: **Home** (hero = newest, then a section per category; ISR 60 s), **/news, /market-wraps, /research, /macro** (paginated at `/<section>/page/<n>`), **Post page** `/posts/[slug]`, **Ticker pages** `/ticker/[exchange]/[symbol]`, **/about** (methodology placeholder), **/search** (client-side over `/search-index.json`; no search infra), **/disclaimer** (expanded placeholder).
Post page: rendered Markdown (GFM tables styled and horizontally scrollable), metrics stat table at the top, ticker chips linking to ticker pages, sources list and "data as of", an "AI-assisted analysis" label, the compliance footer, and a correction banner when retracted. If the slug is unknown, look up `PostRedirect` and `permanentRedirect`; otherwise 404.
**After every API write call `revalidatePath('/', 'layout')`** so changes appear immediately; keep `revalidate = 60` as a fallback.
Markdown safety: no raw HTML (`skipHtml`, never add `rehype-raw`), images only from the Blob host, safe link protocols, external links `rel="noopener noreferrer"`.
Display times in each exchange's zone (Lagos, Accra, Nairobi); store UTC.

### 5.4 SEO (non-negotiable)
SSR/ISR everywhere, semantic HTML; `/feed.xml` (RSS 2.0, published only), `/sitemap.xml`, `robots.txt` (disallow `/api/`); OpenGraph + Twitter meta; **JSON-LD `Article`** on post pages (escape `<` in the JSON); unique title/description from the excerpt; canonical URLs. Post-launch: verify the domain in Google Search Console and submit the sitemap.

### 5.5 Compliance footer (auto-appended to every post page)
"FrontierCap publishes information and research for educational and informational purposes only. It is not investment advice, a recommendation, or an offer to buy or sell any security. Markets involve risk, including loss of capital. Do your own research and consult a licensed adviser. See our full disclaimer." (`src/lib/site.ts` → `DISCLAIMER`; link to `/disclaimer`.) Tell the owner to have a local lawyer review the disclaimer and the AI-authored-research disclosure; securities regulators in Nigeria, Ghana and Kenya may have rules on publishing research. This is a flag, not legal advice.

### 5.6 Design (placeholder only)
White background, one accent colour, generous whitespace, system/Inter font stack, card lists, restrained green/red for deltas, mobile-first. Dark mode is optional (P2). Owner iterates later.

---

## 6. Current state of the scaffold (in `frontiercap-wip.zip`)

**Written and type-checked (`tsc --noEmit` clean), never executed:**
`package.json`, `tsconfig.json`, `next.config.ts` (security headers, no-store on `/api`), `postcss.config.mjs`, `vitest.config.ts`, `prisma.config.ts`, `prisma/schema.prisma`, `.env.example`, `.gitignore`;
`src/lib/`: `errors.ts`, `schemas.ts` (zod; no defaults inside `.partial()` shapes on purpose), `tickers.ts`, `slug.ts`, `auth.ts`, `ratelimit.ts`, `api.ts` (`withApi` wrapper: auth, rate limit, error mapping, logging), `db.ts`, `site.ts`, `format.ts`, `posts.ts` (create/update/retract/list and public queries);
`src/app/api/v1/`: `health`, `posts`, `posts/[ref]`, `media`; `src/app/openapi.json/route.ts`;
`src/components/`: `Markdown`, `MetricsTable`, `Chips`, `PostCard`, `Disclaimer`, `SectionView`, `JsonLd`, `SearchBox`; `src/app/`: `layout`, `globals.css`, `not-found`, `page` (home), `[section]/page.tsx`, `[section]/page/[n]/page.tsx`.

**Still to do** (empty folders `src/app/feed.xml`, `src/app/search-index.json`, `posts/[slug]`, `ticker/...`, `about`, `disclaimer`, `search` exist):
1. `posts/[slug]/page.tsx` (ISR, `generateMetadata`, JSON-LD, correction banner, redirect lookup, `noindex` when retracted, `generateStaticParams` returning `[]`, `dynamicParams = true`).
2. `ticker/[exchange]/[symbol]/page.tsx`; `about`, `disclaimer`, `search` pages.
3. `search-index.json/route.ts` (published only; `allPublishedForIndex()` exists), `feed.xml/route.ts` (escape XML; `revalidate = 60`), `sitemap.ts`, `robots.ts`.
4. **Initial migration**: generate with `prisma migrate dev --name init` against the Neon `dev` branch and commit `prisma/migrations/`. Review the SQL (enums, GIN indexes, FK cascade).
5. Tests (Vitest): slug (collisions, unicode, length), schemas (strict mode, ticker normalisation, PATCH does not reset omitted arrays), auth (constant-time compare, rotation key, short-key misconfiguration → 500), tickers. Add API integration tests against a Neon dev/test branch.
6. `scripts/smoke.mjs` (Node, cross-platform, `BASE_URL` + `API_KEY` env): runs every acceptance criterion below. `scripts/seed.mjs` + `scripts/samples/*.json`.
7. `README.md` (setup, curl for every endpoint, key rotation, Neon point-in-time-restore backup note, deviations), `.github/workflows/ci.yml` (install, `prisma generate`, typecheck, test), `docs/TOOLING.md`, `DESIGN.md`.
8. Provision, deploy, verify (section 7).

**Review the draft critically**; fix what you find. Things to double-check specifically: Prisma 7 error codes under the pg adapter (`P2002` detection in `posts.ts`/`api.ts` falls back to a message match); that `next build` accepts the route handler signatures; `revalidatePath` behaviour in route handlers; that ISR pages do not break `next build` without a DB (they query at build time, so the DB must exist first).

---

## 7. Work plan

**Phase A: setup and review.** Connect GitHub and Neon; install/locate skills (section 2); unzip scaffold; `npm install`; `prisma generate`; `tsc`; `next build` against the Neon dev branch. Write `docs/TOOLING.md`. Commit the scaffold to `main`.
**Phase B: database and API.** Initial migration; run the API locally; write unit + integration tests; apply `security-discipline`, `idempotency-and-side-effects`, `error-handling-as-design`, `testing-with-discernment`; run an API security/contract check. Concurrency test: fire 20 identical `client_ref` POSTs in parallel and assert exactly one row.
**Phase C: public site and SEO.** Finish the pages in section 6; `DESIGN.md`; `seo-check`/`generate-schema`; validate JSON-LD, OG tags, feed and sitemap; accessibility audit.
**Phase D: deploy.** Vercel project from the repo; add integrations; owner sets `API_KEY`; deploy; read build logs and fix. Run `scripts/smoke.mjs` against the live URL. Seed the three samples through the API.
**Phase E: audit and report.** SEO/GEO audit, design critique, `audit` on the API; write the final report.

## 8. Acceptance criteria (all must pass before reporting done)
1. `curl -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" -d @post.json $BASE/api/v1/posts` → 201; the post is visible at the returned URL within 60 s.
2. Repeating the same request (same `client_ref`) → 200 with the same id; no duplicate.
3. `GET /api/v1/posts?category=market_wrap&exchange=NGX` filters correctly.
4. `PATCH` changes the live post body; the update is visible within 60 s (should be near-instant).
5. `DELETE` with `correction_note` → banner visible at the URL; excluded from `/feed.xml`, `/sitemap.xml`, homepage, category and ticker pages.
6. `/feed.xml`, `/sitemap.xml`, `/robots.txt`, JSON-LD and OG tags present and valid.
7. Media upload returns a URL that renders inside a post.
8. Three sample posts seeded (one `market_wrap`, one `equity_analysis`, one `news_brief`) using **fictional companies**, tagged `sample`, with a visible "illustrative sample" note, so the owner can judge layout; tell the owner to retract them before public launch.
9. Auth failures return 401 with the error contract; 61 rapid requests produce a 429 with `Retry-After`; health returns `db: "up"`.

## 9. Final report to the owner
Live site URL; API base URL; confirmation that the owner set `API_KEY` (never print it); README with curl examples for every endpoint; `docs/TOOLING.md` summary; test and smoke-test results (what you ran, what passed); **one paragraph on every deviation and why** (known so far: Prisma enums; `EXCHANGE:SYMBOL` tickers; `PostRedirect`; `sources`/`as_of` fields; 4 MB media cap; no CORS; Upstash rate limiting; `/openapi.json`; `datasource` URL in `prisma.config.ts`); open risks (Hobby plan terms, legal review, Neon free-tier cold starts); and a reminder to revoke every temporary token.
