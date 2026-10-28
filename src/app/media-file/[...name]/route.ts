import { get } from '@vercel/blob'
import { MEDIA_STORE_RE } from '@/lib/media'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ name?: string[] }> }

export async function GET(_req: Request, ctx: Ctx) {
  const raw = (await ctx.params)?.name
  const rel = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(Boolean).join('/')
  if (!MEDIA_STORE_RE.test(rel)) {
    return new Response(JSON.stringify({ error: { code: 'not_found', message: 'Unknown media file' } }), { status: 404, headers: { 'content-type': 'application/json' } })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response(JSON.stringify({ error: { code: 'storage_not_configured', message: 'Media storage is not configured' } }), { status: 503, headers: { 'content-type': 'application/json' } })
  }
  const res = await get(rel, { access: 'private' }).catch(() => null)
  if (!res) {
    return new Response(JSON.stringify({ error: { code: 'not_found', message: 'Media file not found' } }), { status: 404, headers: { 'content-type': 'application/json' } })
  }
  const buf = Buffer.from(await new Response(res.stream).arrayBuffer())
  return new Response(buf, {
    status: 200,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}