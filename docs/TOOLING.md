# FrontierCap — Tooling Inventory (Phases A–C)

Updated 2026-10-28. Records what this harness offers, what is missing, and the
project-local playbooks written to cover the gaps. See `docs/playbooks/` for the checklists
followed instead of the named skills/plugins.

## Runtime / local toolchain

| Tool | Version / status | Notes |
|------|------------------|-------|
| Node.js | v24.x | >= 22 required by package.json engines. OK. |
| npm | 11.x | Install/scripts. |
| git | 2.x | Commits and pushes. |
| TypeScript | ~5.9 (via deps) | `tsc --noEmit` clean. |
| Next.js | 16.4.3 | App Router, ISR `revalidate=60`, Turbopack. |
| Prisma | 7.10.1 + `@prisma/adapter-pg` | Client generated to `src/generated/prisma`. |
| Vitest | 3.x | `npm test` = `vitest run`. |
| PostgreSQL | 17.x (local) | Installed locally for dev/test because Neon is unreachable here. |

## Install / generate status

- `npm install`: **succeeded**; Prisma client auto-generated via `postinstall`.
- `npx tsc --noEmit`: **passes, 0 errors** (including the Phase C pages).
- `npx vitest run`: **60/60 pass** against a real local Postgres.
- `npm run build`: **succeeds** when `DATABASE_URL` is set; **fails without it** because the
  section pages prerender and query the DB. Confirms the documented deploy order.

## External CLIs / connectors

| Capability | Status in this harness | Fallback used |
|------------|------------------------|---------------|
| GitHub CLI (`gh`) | available; `GITHUB_TOKEN` set | Plain `git` + GitHub API. |
| Vercel CLI | **not installed** | Owner deploys via the Vercel dashboard/UI. |
| `neonctl` | **not installed** | Local PostgreSQL 17 for dev/test; Neon via dashboard. |
| `psql` | installed locally | Direct inspection of tables and indexes. |
| `unzip` | not installed | Python `zipfile` if the scaffold zip is needed. |
| GitHub / Neon / Vercel MCP connectors | **not active** in this session | Manual steps documented for the owner. |
| Docker daemon | not running | Local Postgres installed natively instead. |

## Skills / plugins found vs. written

The named skill families in the brief (`think-before-coding`, `design`, `audit`,
`data-modeling-discipline`, `migration-safety`, `idempotency-and-side-effects`,
`error-handling-as-design`, `auth-and-authorization`, `security-discipline`,
`testing-with-discernment`, the SearchFit SEO family, `frontend-design`, `design-system`,
`accessibility-audit`, `ux-writing`, and the API-drift / 42Crunch plugins) are **not
available** as installable plugins in this harness. Per section 2, equivalent project-local
playbooks were written and followed:

| Missing capability | Project-local substitute |
|--------------------|--------------------------|
| `think-before-coding`, `data-modeling-discipline`, `migration-safety` | `docs/playbooks/backend-discipline.md` |
| `idempotency-and-side-effects`, `error-handling-as-design` | `docs/playbooks/backend-discipline.md` |
| `security-discipline`, `auth-and-authorization`, `audit` | `docs/playbooks/api-security.md` |
| `testing-with-discernment` | `docs/playbooks/testing.md` |
| `seo-check`, `generate-schema`, `technical-seo` | `docs/playbooks/seo.md` |
| `frontend-design`, `design-system`, `accessibility-audit` | `DESIGN.md` + `docs/playbooks/seo.md` (a11y section) |
| API drift detector (schema vs OpenAPI) | `src/lib/openapi.contract.test.ts` (8 assertions) |

Available skills that *were* usable here: `github`, `github-actions`, `security`, `vercel`,
`npm`. They informed the CI workflow, the security posture and the deploy notes.

## Deviations carried forward

Prisma enums; `EXCHANGE:SYMBOL` tickers; `PostRedirect`; `sources`/`asOf` fields; 4 MB media
cap; no CORS; Upstash rate limiting; served `/openapi.json`; datasource URL in
`prisma.config.ts`. All intentional; listed again in the Phase E report.
