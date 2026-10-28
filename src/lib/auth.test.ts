import { describe, expect, it } from 'vitest'
import { randomBytes } from 'node:crypto'
import { authenticate, loadKeyHashes } from './auth'
import { ApiError } from './errors'

const KEY = randomBytes(32).toString('hex')
const OLD = randomBytes(32).toString('hex')

function req(authorization?: string): Request {
  const h: Record<string, string> = {}
  if (authorization !== undefined) h.authorization = authorization
  return new Request('http://localhost/api', { headers: h })
}

describe('authenticate', () => {
  it('accepts the primary key', () => {
    const r = authenticate(req('Bearer ' + KEY), { API_KEY: KEY })
    expect(r.keyId).toHaveLength(12)
  })
  it('accepts the rotation key during rollover', () => {
    const r = authenticate(req('Bearer ' + OLD), { API_KEY: KEY, API_KEY_ROTATION: OLD })
    expect(r.keyId).toHaveLength(12)
  })
  it('rejects an unknown key with 401 invalid_api_key + WWW-Authenticate', () => {
    try {
      authenticate(req('Bearer nope'), { API_KEY: KEY })
      expect.unreachable('should throw')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      const err = e as ApiError
      expect(err.status).toBe(401)
      expect(err.code).toBe('invalid_api_key')
      expect(err.headers).toMatchObject({ 'WWW-Authenticate': 'Bearer' })
    }
  })
  it('rejects missing or malformed headers with 401 unauthorized', () => {
    for (const r of [req(), req('Token abc'), req('Bearer')]) {
      try {
        authenticate(r, { API_KEY: KEY })
        expect.unreachable('should throw')
      } catch (e) {
        expect((e as ApiError).status).toBe(401)
        expect((e as ApiError).code).toBe('unauthorized')
      }
    }
  })
  it('fails closed when the configured key is shorter than 40 chars', () => {
    try {
      authenticate(req('Bearer x'), { API_KEY: 'short' })
      expect.unreachable('should throw')
    } catch (e) {
      const err = e as ApiError
      expect(err.status).toBe(500)
      expect(err.code).toBe('server_misconfigured')
    }
  })
  it('fails closed when no key is configured at all', () => {
    try {
      loadKeyHashes({})
      expect.unreachable('should throw')
    } catch (e) {
      expect((e as ApiError).status).toBe(500)
      expect((e as ApiError).code).toBe('server_misconfigured')
    }
  })
})