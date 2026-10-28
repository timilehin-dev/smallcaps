# Playbook: API security

Project-local substitute for the `security-discipline`, `auth-and-authorization` and `audit`
plugins.

## Auth
- Bearer key in the `Authorization` header only. Never in query strings, never logged.
- Key must be >= 40 chars; a shorter configured key is a misconfiguration -> 500, not a
  silent accept.
- Compare SHA-256 digests with a constant-time comparison.
- `API_KEY_ROTATION` is accepted alongside `API_KEY` for zero-downtime rotation.

## Input
- Strict zod objects: unknown fields are rejected, not ignored.
- Caps: `body_md` 200 KB, request JSON 300 KB, media 4 MB (validated by magic bytes).
- Uploaded files are validated by content, not by extension or declared MIME type.

## Transport / exposure
- No CORS headers: the consumer is a server-to-server agent, not a browser.
- `/api/*` is `no-store` and `Disallow`ed in robots.txt.
- Rate limit 60 req/min per key (Upstash sliding window), 429 with `Retry-After`;
  fails open if Redis errors, in-memory fallback is local-dev only.

## Audit checklist
- [x] Every endpoint but `/health` requires a valid key.
- [x] 401/404/409/413/415/429/500 all return the error contract.
- [x] Secrets only via env; `.env*` gitignored except `.env.example`.
- [x] Rendered Markdown cannot execute script (raw HTML skipped, protocols filtered).
- [x] No raw key in logs or error bodies.
