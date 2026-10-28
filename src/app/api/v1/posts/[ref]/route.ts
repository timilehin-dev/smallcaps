import { ApiError } from '@/lib/errors'
import { json, readJson, withApi } from '@/lib/api'
import { getByRef, retractPost, revalidateSite, serialize, updatePost } from '@/lib/posts'
import { deleteSchema, patchSchema } from '@/lib/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// `ref` accepts a post id or a slug.

export const GET = withApi(async (_req, { params }) => {
  const post = await getByRef(params.ref)
  if (!post) throw new ApiError(404, 'not_found', `No post with id or slug "${params.ref}"`)
  return json(serialize(post))
})

export const PATCH = withApi(async (req, { params }) => {
  const patch = patchSchema.parse(await readJson(req))
  const post = await updatePost(params.ref, patch)
  revalidateSite()
  return json(serialize(post))
})

// Soft delete: the post stays at its URL with a correction banner.
export const DELETE = withApi(async (req, { params }) => {
  const body = deleteSchema.parse(await readJson(req, { optional: true }))
  const post = await retractPost(params.ref, body.correction_note)
  revalidateSite()
  return json(serialize(post))
})
