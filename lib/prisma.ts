import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Prisma Client singleton instance
 * 
 * Prevents multiple instances of Prisma Client in development
 * by reusing the same instance across hot reloads.
 * 
 * @example
 * ```ts
 * import { prisma } from '@/lib/prisma'
 * 
 * const users = await prisma.user.findMany()
 * ```
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: (() => {
        const databaseUrl = process.env.DATABASE_URL
        if (!databaseUrl) throw new Error('DATABASE_URL is not set')
        return databaseUrl
      })(),
    }),
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

