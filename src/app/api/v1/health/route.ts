import { NextResponse } from 'next/server'
import { withApi } from '@/lib/api'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withApi(
  async () => {
    try {
      await getDb().$queryRaw`SELECT 1`
      return NextResponse.json({ ok: true, db: 'up' })
    } catch (err) {
      console.error(JSON.stringify({ level: 'error', msg: 'health_db_down', err: String(err) }))
      return NextResponse.json({ ok: false, db: 'down' }, { status: 503 })
    }
  },
  { auth: false },
)
