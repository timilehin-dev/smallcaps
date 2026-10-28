import { createHash, timingSafeEqual } from 'node:crypto'
import { ApiError } from './errors'

const sha256 = (s: string) => createHash('sha256').update(s).digest()

type Env = Record<string, string | undefined>

/** Hashes of the configured keys (primary + optional rotation key). */
export function loadKeyHashes(env: Env = process.env): Buffer[] {
  const keys = [env.API_KEY, env.API_KEY_ROTATION].filter((k): k is string => !!k)
  if (keys.length === 0 || keys.some((k) => k.length < 40)) {
    throw new ApiError(500, 'server_misconfigured', 'API authentication is not configured correctly')
  }
  return keys.map(sha256)
}

/** Validates the bearer token. Compares SHA-256 digests in constant time; never logs the key. */
export function authenticate(req: Request, env: Env = process.env): { keyId: string } {
  const hashes = loadKeyHashes(env)
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') ?? '')
  if (!match) {
    throw new ApiError(
      401,
      'unauthorized',
      'Missing or malformed Authorization header. Use: Authorization: Bearer <API_KEY>',
      undefined,
      { 'WWW-Authenticate': 'Bearer' },
    )
  }
  const given = sha256(match[1])
  let ok = false
  for (const h of hashes) ok = timingSafeEqual(given, h) || ok // no early exit
  if (!ok) {
    throw new ApiError(401, 'invalid_api_key', 'Invalid API key', undefined, {
      'WWW-Authenticate': 'Bearer',
    })
  }
  return { keyId: given.toString('hex').slice(0, 12) }
}
