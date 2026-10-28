# FrontierCap — deploy runbook

The coding agent could not execute this phase: this environment has no
`VERCEL_TOKEN`, `NEON_API_KEY`, `BLOB_READ_WRITE_TOKEN` or Upstash credentials, and
neither the Vercel CLI nor `neonctl` is installed. Everything below was verified locally
against PostgreSQL 17 (same major version as Neon). Follow it in order — the order matters
because the build runs migrations and prerenders DB-backed pages.

## 0. Prerequisites

- Node >= 22 and npm.
- Write access to `timilehin-dev/smallcaps`.
- A Vercel account (Hobby is fine for launch; see "Hobby plan" below).

## 1. Neon

1. Create project `frontiercap`. Pick the region closest to the audience (Europe or US East).
2. Create a `dev` branch for local work; keep `main` as the production branch.
3. Copy both connection strings from the dashboard:
   - **pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **direct / unpooled** → `DIRECT_URL` (the code also accepts `DATABASE_URL_UNPOOLED`)
4. Rehearse the migration on the `dev` branch before touching production:

   ```bash
   export DATABASE_URL='<dev pooled>' DIRECT_URL='<dev direct>'
   npx prisma migrate deploy
   ```

5. Backups: Neon provides point-in-time restore on the project's retention window. Note the
   window in your runbook; it is the recovery path for a bad write.

## 2. Upstash Redis and Vercel Blob

Add both through Vercel's integration marketplace so the credentials are injected as
environment variables rather than pasted by hand.

- Upstash → injects `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
  (the code also reads the older `KV_REST_API_URL` / `KV_REST_API_TOKEN`).
- Blob → injects `BLOB_READ_WRITE_TOKEN`.

Do **not** add Prisma Postgres as well — one Postgres provider only (Neon).

## 3. Vercel project

1. Create the project from `timilehin-dev/smallcaps`. **Turn auto-deploy off first.**
2. Set these for Production *and* Preview:
   - `DATABASE_URL` (pooled)
   - `DIRECT_URL` (direct)
   - `API_KEY` — generate with `openssl rand -hex 32` and paste it in the dashboard.
     Never commit it; never share it in a chat.
   - `API_KEY_ROTATION` (optional, for zero-downtime rotation)
   - `SITE_URL` (public origin; falls back to `VERCEL_PROJECT_PRODUCTION_URL`)
   - the Blob and Upstash variables injected in step 2
3. Build command: `npm run vercel-build` (runs `prisma generate && prisma migrate deploy &&
   next build`).
4. Deploy. Then read the build log and fix anything it reports.

If the first deploy fails, the usual cause is a missing `DATABASE_URL` — the build
prerenders the section pages and queries the DB, so it cannot succeed without it.

## 4. Verify

```bash
export BASE_URL='https://<your-deployment>'
export API_KEY='<the key you set>'
node scripts/smoke.mjs
```

`scripts/smoke.mjs` walks every acceptance criterion in the brief: auth failures, create,
idempotent replay, filters, PATCH, DELETE with a correction note, retracted exclusion,
rate limiting and health. All checks must pass.

Then seed the samples and check the pages by eye:

```bash
node scripts/seed.mjs
```

The three sample posts use fictional companies and are tagged `sample`. **Retract them
before public launch** — they exist so you can judge layout.

## 5. After launch

- Verify the domain in Google Search Console and submit `/sitemap.xml`.
- Have a lawyer review `/disclaimer` and the AI-authored-research disclosure.
- Rotate `API_KEY`: set `API_KEY_ROTATION` to the new key, deploy, point the agent at the
  new key, then promote it to `API_KEY` and clear the rotation variable.

## Hobby plan

Vercel's Hobby plan is documented as non-commercial. If FrontierCap will carry advertising
or paid subscriptions, plan to move to a paid plan before monetising.
