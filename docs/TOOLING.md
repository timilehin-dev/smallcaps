# FrontierCap — Tooling Inventory (Phase A)

Checked 2026-10-28 on the agent host (Windows). This records what is available, what is
missing, and the fallbacks agreed for the build. Nothing in here is final; it updates as
Phases B–E proceed.

## Runtime / local toolchain

| Tool | Version / status | Notes |
|------|------------------|-------|
| Node.js | v24.18.0 | >= 22 required by package.json engines. OK. |
| npm | 11.16.0 | Used for install/scripts. |
| git | 2.54.0 | Available for commits. |
| TypeScript | ~5.9 (via deps) | tsc --noEmit runs clean after install. |
| Next.js | 16.4.3 | App Router, ISR revalidate=60. |
| Prisma | 7.10.1 + @prisma/adapter-pg | Client generated to src/generated/prisma on postinstall. |
| Vitest | 3 | Test runner (npm test = vitest run). No tests exist yet. |

## Install / generate status

- npm install: **succeeded** (368 packages). Prisma client auto-generated via postinstall.
- npx prisma generate: **succeeded** (Client 7.10.1 -> src/generated/prisma).
- npx tsc --noEmit: **passed with 0 errors**. Scaffold type-checks cleanly.
- npm audit: 9 vulnerabilities reported (3 moderate, 4 high, 2 critical). To be
  reviewed in Phase E; likely transitive. No changes made in Phase A.
- Install-script note: npm flagged prisma, @prisma/engines, esbuild install
  scripts as not covered by allow-scripts. They ran (client generated), but this should
  be confirmed for the Vercel build pipeline.

## External CLIs / connectors

| Capability | Status in this harness | Fallback |
|------------|------------------------|----------|
| GitHub CLI (gh) | **Not installed** | Plain git + browser; project-local playbook in docs/. |
| Vercel CLI | **Not installed** | Vercel web console + Neon/Upstash/Blob integrations set up by owner; deploy via Vercel UI or npm run vercel-build semantics. |
| neonctl | **Not installed** | Neon dashboard for branch/migration; Prisma Migrate against the dev branch via npm run db:migrate. |
| GitHub / Neon / Vercel MCP connectors | **Not active** in this session | Manual steps documented; owner performs account-side actions. |

## Scaffold: what exists vs. what is still to build

### Present (reviewed)
- src/lib/: api.ts, auth.ts, db.ts, errors.ts, format.ts, posts.ts,
  ratelimit.ts, schemas.ts, site.ts, slug.ts, tickers.ts — full API/read layer.
- src/app/api/v1/: health, media, posts (POST/GET), posts/[ref] (GET/PATCH/DELETE).
- src/app/: layout.tsx, page.tsx (home), [section]/page.tsx, [section]/page/[n]/page.tsx,
  not-found.tsx, openapi.json route.
- src/components/: Chips, Disclaimer, JsonLd, Markdown, MetricsTable,
  PostCard, SearchBox, SectionView.
- prisma/schema.prisma, prisma.config.ts, config files, .env.example, scripts/
  (smoke.mjs, seed.mjs referenced in package.json).

### Missing / to build (Phases B–D)
- Public pages: posts/[slug], ticker/[exchange]/[symbol], about, disclaimer, search.
- SEO routes: feed.xml (RSS 2.0, published only), sitemap.xml, robots.txt,
  search-index.json.
- DESIGN.md (placeholder design system).
- Unit + integration tests (slug collisions/unicode/length, strict schemas, ticker
  normalization, PATCH no-reset, auth constant-time/rotation/short-key->500).
- Concurrency test: 20 identical client_ref POSTs in parallel -> exactly one row.
- Prisma migration for the Neon dev branch (prisma/migrations/).

## Deviations carried forward
Prisma enums, EXCHANGE:SYMBOL tickers, PostRedirect, sources/asOf fields,
4MB media cap, no CORS, Upstash rate limiting, /openapi.json, datasource URL read in
prisma.config.ts. All already reflected in code; recorded here so the final Phase E
report can list them as intentional deviations from the original spec text.
