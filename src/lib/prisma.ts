import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const dbUrl = process.env['DATABASE_URL'] ?? 'file:./prisma/dev.db'
const adapter = new PrismaBetterSqlite3({ url: dbUrl })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma = new PrismaClient({ adapter } as any)