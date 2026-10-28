import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const RATE_LIMIT = 60 // requests per minute per key
const WINDOW_MS = 60_000

export type RateResult = { ok: boolean; limit: number; remaining: number; retryAfter: number }

let limiter: Ratelimit | null | undefined

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  limiter =
    url && token
      ? new Ratelimit({
          redis: new Redis({ url, token }),
          limiter: Ratelimit.slidingWindow(RATE_LIMIT, '60 s'),
          prefix: 'frontiercap:rl',
        })
      : null
  return limiter
}

// Per-instance fallback for local dev. Not shared across serverless instances.
const memory = new Map<string, { count: number; resetAt: number }>()

function memoryCheck(id: string): RateResult {
  const now = Date.now()
  let entry = memory.get(id)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS }
    memory.set(id, entry)
  }
  entry.count += 1
  return {
    ok: entry.count <= RATE_LIMIT,
    limit: RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - entry.count),
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  }
}

export async function checkRate(id: string): Promise<RateResult> {
  const l = getLimiter()
  if (!l) return memoryCheck(id)
  try {
    const r = await l.limit(id)
    return {
      ok: r.success,
      limit: r.limit,
      remaining: r.remaining,
      retryAfter: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
    }
  } catch (err) {
    // Fail open: a Redis outage must not take the agent's API down.
    console.error(JSON.stringify({ level: 'error', msg: 'ratelimit_backend_error', err: String(err) }))
    return { ok: true, limit: RATE_LIMIT, remaining: RATE_LIMIT, retryAfter: 1 }
  }
}
