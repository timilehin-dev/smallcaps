import { randomUUID } from 'node:crypto'

// Media is stored as (possibly private) Vercel Blob objects and served publicly
// through the /media-file/[...name] route, which reads with BLOB_READ_WRITE_TOKEN.
// This keeps the blob store private while post images stay renderable, and works
// regardless of the store's access mode.

/** Store-side path shape: media/YYYY-MM/<uuid>.<ext> */
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

export const MEDIA_STORE_RE = new RegExp('^media/\\d{4}-\\d{2}/' + UUID + '\\.(jpg|png|webp)$', 'i')

/** Browser-side URL for images embedded in Markdown (relative: stable across domains). */
export const MEDIA_FILE_RE = new RegExp('^/media-file/media/\\d{4}-\\d{2}/' + UUID + '\\.(jpg|png|webp)$', 'i')

export function mediaStoreName(ext: 'jpg' | 'png' | 'webp'): string {
  const month = new Date().toISOString().slice(0, 7)
  return `media/${month}/${randomUUID()}.${ext}`
}

export function mediaUrl(storeName: string): string {
  return `/media-file/${storeName}`
}