# Playbook: backend discipline

Project-local substitute for the `think-before-coding`, `data-modeling-discipline`,
`migration-safety`, `idempotency-and-side-effects` and `error-handling-as-design` plugins.

## Before writing a component
1. Write down the invariant in one sentence, then the failure modes, then the schema.
2. Decide the transaction boundary before writing queries.
3. Prefer the database's guarantees (unique indexes, FKs) over application checks.

## Data modelling
- Enums in the database, not free-text strings, so bad values cannot be stored.
- Collisions are handled by a unique index + retry, never check-then-insert.
- Soft delete (`status`) rather than row deletion, so URLs stay alive.
- Store instants in UTC; convert for display only.

## Migration safety
- `prisma migrate dev` produces reviewed SQL; read it before committing.
- Every migration must be additive-or-reversible; no destructive change without a note.
- Rehearse on a Neon `dev` branch, then `prisma migrate deploy` in the build.

## Idempotency
- `client_ref` is a unique column. On replay, return the existing row (200), not a duplicate.
- The insert is attempted and the unique violation is caught, so concurrent identical
  requests collapse to one row (verified with 20 parallel requests).

## Error handling
- One error shape everywhere: `{error:{code,message,details?}}`.
- Map known failures to status codes centrally; 500s never leak internals.
- Every response carries `X-Request-Id`; one structured log line per request, no secrets.
