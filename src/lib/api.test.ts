import { beforeAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { ZodError, z } from 'zod'
import { randomBytes } from 'node:crypto'
import { readJson, withApi } from './api'
import { ApiError } from './errors'

const KEY = randomBytes(32).toString('hex')

type NInit = { method?: string; body?: string; headers?: Record<string, string> }

function nreq(path: string, init?: NInit): NextRequest {
  return new NextRequest('http://localhost' + path, init)
}

beforeAll(() => {
  process.env.API_KEY = KEY
  // Force the in-memory rate limiter so unit tests never touch Upstash.
  delete process.env.KV_REST_API_URL
  delete process.env.KV_REST_API_TOKEN
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
})

describe('readJson', () => {
  it('rejects malformed JSON with 400 invalid_json', async () => {
    await expect(readJson(nreq('/x', { method: 'POST', body: '{bad' }))).rejects.toMatchObject({
      status: 400,
      code: 'invalid_json',
    })
  })
  it('rejects an empty body, or returns {} when optional', async () => {
    await expect(readJson(nreq('/x', { method: 'POST', body: '' }))).rejects.toMatchObject({
      code: 'invalid_json',
    })
    await expect(readJson(nreq('/x', { method: 'POST', body: '' }), { optional: true })).resolves.toEqual({})
  })
  it('parses a valid body', async () => {
    await expect(readJson(nreq('/x', { method: 'POST', body: '{"a":1}' }))).resolves.toEqual({ a: 1 })
  })
  it('enforces the 300KB payload cap (413 payload_too_large)', async () => {
    const big = 'x'.repeat(300 * 1024 + 1)
    await expect(readJson(nreq('/x', { method: 'POST', body: big }))).rejects.toMatchObject({
      status: 413,
      code: 'payload_too_large',
    })
    await expect(readJson(nreq('/x', { method: 'POST', body: '12345' }), { maxBytes: 5 })).resolves.toBe(12345)
    await expect(readJson(nreq('/x', { method: 'POST', body: '123456' }), { maxBytes: 5 })).rejects.toMatchObject({
      status: 413,
    })
  })
})

describe('withApi', () => {
  const ctx = () => ({ params: Promise.resolve({}) })

  it('stamps X-Request-Id on every response', async () => {
    const route = withApi(async () => new Response('ok'), { auth: false })
    const res = await route(nreq('/api/v1/posts'), ctx())
    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })

  it('maps ApiError to the error contract', async () => {
    const route = withApi(() => {
      throw new ApiError(404, 'not_found', 'nope')
    }, { auth: false })
    const res = await route(nreq('/x'), ctx())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'not_found', message: 'nope' } })
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('maps ZodError to 400 validation_error with issue paths', async () => {
    let zodErr: ZodError
    try {
      z.object({ title: z.string().min(5) }).parse({ title: 'ab' })
    } catch (e) {
      zodErr = e as ZodError
    }
    const route = withApi(() => {
      throw zodErr
    }, { auth: false })
    const res = await route(nreq('/x'), ctx())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('validation_error')
    expect(body.error.details[0].path).toBe('title')
  })

  it('maps Prisma P2002/P2025 to 409/404', async () => {
    for (const [code, status] of [
      ['P2002', 409],
      ['P2025', 404],
    ] as const) {
      const route = withApi(() => {
        throw Object.assign(new Error(code), { code })
      }, { auth: false })
      const res = await route(nreq('/x'), ctx())
      expect(res.status).toBe(status)
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
        code === 'P2002' ? 'conflict' : 'not_found',
      )
    }
  })

  it('maps unexpected errors to 500 internal_error with the request id', async () => {
    const route = withApi(() => {
      throw new Error('boom')
    }, { auth: false })
    const res = await route(nreq('/x'), ctx())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('internal_error')
    expect(body.error.details.request_id).toBe(res.headers.get('x-request-id'))
  })

  it('requires Bearer auth on protected routes', async () => {
    const route = withApi(async () => new Response('authed'), { auth: true })
    const noAuth = await route(nreq('/x'), ctx())
    expect(noAuth.status).toBe(401)
    expect(noAuth.headers.get('www-authenticate')).toBe('Bearer')
    const okRes = await route(
      nreq('/x', { headers: { authorization: 'Bearer ' + KEY } }),
      ctx(),
    )
    expect(okRes.status).toBe(200)
  })
})