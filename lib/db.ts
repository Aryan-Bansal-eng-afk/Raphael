import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
  // Extract file path from "file:./dev.db" format
  const dbPath = dbUrl.startsWith('file:')
    ? path.resolve(dbUrl.replace('file:', ''))
    : path.resolve('./dev.db')

  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  // @ts-ignore - Prisma 7 adapter
  return new PrismaClient({ adapter, log: ['error'] })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
