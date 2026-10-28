import { json, readJson, withApi } from '@/lib/api'
import { createPost, listPosts, postUrl, revalidateSite, serialize } from '@/lib/posts'
import { createSchema, listQuerySchema } from '@/lib/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withApi(async (req) => {
  const input = createSchema.parse(await readJson(req))
  const { post, created } = await createPost(input)
  if (created) revalidateSite()
  return json(
    {
      id: post.id,
      slug: post.slug,
      status: post.status,
      url: postUrl(post.slug),
      ...(created ? {} : { idempotent_replay: true }),
    },
    { status: created ? 201 : 200, headers: created ? undefined : { 'Idempotent-Replay': 'true' } },
  )
})

export const GET = withApi(async (req) => {
  const q = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
  const { data, total } = await listPosts(q)
  return json({ data: data.map(serialize), page: q.page, per_page: q.per_page, total })
})
