import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Migrations use the direct (unpooled) connection when available.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      '',
  },
})
