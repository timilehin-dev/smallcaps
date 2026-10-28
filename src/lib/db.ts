import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const g = globalThis as unknown as { __prisma?: PrismaClient }

/** Lazy so that importing this module never requires a database (e.g. at build time). */
export function getDb(): PrismaClient {
  if (!g.__prisma) {
    const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
    if (!connectionString) throw new Error('DATABASE_URL is not set')
    g.__prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 3 }) })
  }
  return g.__prisma
}
