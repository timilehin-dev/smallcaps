# Playbook: testing with discernment

Project-local substitute for the `testing-with-discernment` plugin.

## What to test
Behaviour that can break silently: slug collisions, strict validation, ticker
normalisation, auth comparison, idempotent replay, re-slug + redirect, retraction
exclusions. Not trivial getters.

## How
- Real code paths only. Integration tests run against a real PostgreSQL database; they skip
  when `DATABASE_URL` is unset so CI without a DB still passes unit tests.
- Concurrency is tested for real: 20 parallel identical `client_ref` POSTs must produce one row.
- Contract tests assert the OpenAPI document and zod schemas agree (drift guard).

## Current state
60 tests across 7 files, all passing against local PostgreSQL 17.
