import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ApiError } from './errors'
import { authenticate } from './auth'
import { checkRate } from './ratelimit'

type Ctx = { params?: Promise<Record<string, string>> }
type Handler = (
  req: NextRequest,
  ctx: { params: Record<string, string>; requestId: string },
) => Promise<Response>

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init)

export async function readJson(req: Request, opts: { optional?: boolean; maxBytes?: number } = {}) {
  const max = opts.maxBytes ?? 300 * 1024
  if (Number(req.headers.get('content-length') ?? 0) > max) {
    throw new ApiError(413, 'payload_too_large', `Request body exceeds ${max} bytes`)
  }
  const text = await req.text()
  if (Buffer.byteLength(text) > max) {
    throw new ApiError(413, 'payload_too_large', `Request body exceeds ${max} bytes`)
  }
  if (!text.trim()) {
    if (opts.optional) return {}
    throw new ApiError(400, 'invalid_json', 'Request body is empty')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError(400, 'invalid_json', 'Request body is not valid JSON')
  }
}

function toErrorResponse(e: unknown, requestId: string): { res: Response; code: string } {
  if (e instanceof ApiError) {
    return {
      code: e.code,
      res: NextResponse.json(
        { error: { code: e.code, message: e.message, ...(e.details !== undefined && { details: e.details }) } },
        { status: e.status, headers: e.headers },
      ),
    }
  }
  if (e instanceof ZodError) {
    return {
      code: 'validation_error',
      res: NextResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'Request validation failed',
            details: e.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          },
        },
        { status: 400 },
      ),
    }
  }
  const prismaCode = typeof e === 'object' && e !== null ? (e as { code?: string }).code : undefined
  if (prismaCode === 'P2002') {
    return {
      code: 'conflict',
      res: NextResponse.json(
        { error: { code: 'conflict', message: 'A record with these unique values already exists' } },
        { status: 409 },
      ),
    }
  }
  if (prismaCode === 'P2025') {
    return {
      code: 'not_found',
      res: NextResponse.json({ error: { code: 'not_found', message: 'Record not found' } }, { status: 404 }),
    }
  }
  console.error(JSON.stringify({ level: 'error', msg: 'unhandled', requestId, err: String(e), stack: (e as Error)?.stack }))
  return {
    code: 'internal_error',
    res: NextResponse.json(
      { error: { code: 'internal_error', message: 'Unexpected server error', details: { request_id: requestId } } },
      { status: 500 },
    ),
  }
}

export function withApi(handler: Handler, opts: { auth?: boolean } = {}) {
  const requireAuth = opts.auth !== false
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    const requestId = crypto.randomUUID()
    const started = Date.now()
    let keyId: string | undefined
    let code: string | undefined
    let res: Response
    try {
      if (requireAuth) {
        keyId = authenticate(req).keyId
        const rl = await checkRate(keyId)
        if (!rl.ok) {
          throw new ApiError(
            429,
            'rate_limited',
            `Rate limit of ${rl.limit} requests per minute exceeded`,
            undefined,
            { 'Retry-After': String(rl.retryAfter) },
          )
        }
      }
      res = await handler(req, { params: (await ctx?.params) ?? {}, requestId })
    } catch (e) {
      const out = toErrorResponse(e, requestId)
      res = out.res
      code = out.code
    }
    res.headers.set('X-Request-Id', requestId)
    console.log(
      JSON.stringify({
        level: res.status >= 500 ? 'error' : 'info',
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        status: res.status,
        ms: Date.now() - started,
        ...(code && { code }),
        ...(keyId && { keyId }),
      }),
    )
    return res
  }
}
