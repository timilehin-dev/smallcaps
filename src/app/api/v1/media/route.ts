import { put } from '@vercel/blob'
import { ApiError } from '@/lib/errors'
import { json, withApi } from '@/lib/api'
import { mediaStoreName, mediaUrl } from '@/lib/media'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Vercel serverless functions reject request bodies above ~4.5MB, so the cap is 4MB.
const MAX_BYTES = 4 * 1024 * 1024

function sniff(b: Buffer): { mime: string; ext: 'jpg' | 'png' | 'webp' } | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: 'image/png', ext: 'png' }
  if (b.length > 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP')
    return { mime: 'image/webp', ext: 'webp' }
  return null
}

export const POST = withApi(async (req) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ApiError(503, 'storage_not_configured', 'Media storage is not configured (BLOB_READ_WRITE_TOKEN)')
  }
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES + 64 * 1024) {
    throw new ApiError(413, 'payload_too_large', 'Image must be 4MB or smaller')
  }
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    throw new ApiError(400, 'invalid_multipart', 'Send multipart/form-data with a "file" field')
  }
  const file = form.get('file')
  if (!(file instanceof File)) throw new ApiError(400, 'validation_error', 'Missing "file" field')
  if (file.size > MAX_BYTES) throw new ApiError(413, 'payload_too_large', 'Image must be 4MB or smaller')

  const buf = Buffer.from(await file.arrayBuffer())
  const type = sniff(buf) // trust the bytes, not the client-supplied content type
  if (!type) throw new ApiError(415, 'unsupported_media_type', 'Only JPEG, PNG and WebP images are accepted')

  // access:'private' — the blob store is configured private. The image is stored
  // under the store's namespace and exposed publicly via the /media-file/[...name]
  // reader, which fetches server-side with BLOB_READ_WRITE_TOKEN.
  const name = mediaStoreName(type.ext)
  await put(name, buf, { access: 'private', contentType: type.mime, addRandomSuffix: false })
  return json({ url: mediaUrl(name) }, { status: 201 })
})