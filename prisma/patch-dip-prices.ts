/**
 * Updates the four named Dips to the current catalog (Large Dip + optional tray).
 * Does not delete orders or other tables; only updates these meals by exact name.
 *
 * Run (with DATABASE_URL pointing at the target DB):
 *   npm run db:patch-dip-prices
 *
 * Do not run this as part of seed. Editing seed.ts alone does not change existing rows.
 */
import './load-env'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const envDatabaseUrl = process.env.DATABASE_URL
if (!envDatabaseUrl) throw new Error('DATABASE_URL is not set')
const databaseUrl: string = envDatabaseUrl

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
} as any)

function logDatabaseTarget(url: string) {
  try {
    const normalized = url.replace(/^postgresql:/i, 'https:')
    const u = new URL(normalized)
    console.log(`[patch-dip-prices] DATABASE_URL → host: ${u.hostname} (path: ${u.pathname || '/'})`)
  } catch {
    console.log('[patch-dip-prices] DATABASE_URL is set (could not parse for logging)')
  }
}

const DIP_UPDATES = [
  {
    name: 'Hummus',
    description: 'Chickpea & tahini dip.',
    price: 16,
    priceSmall: null,
    priceMedium: null,
    priceLarge: 16,
    priceBainMarie: 45,
    pricingType: 'SIZED' as const,
  },
  {
    name: 'Eggplant Dip (Baba Ghanoush)',
    description: 'Smoky roasted eggplant dip.',
    price: 20,
    priceSmall: null,
    priceMedium: null,
    priceLarge: 20,
    priceBainMarie: 48,
    pricingType: 'SIZED' as const,
  },
  {
    name: 'Tahini Dip',
    description: 'Creamy sesame & tahini dip.',
    price: 18,
    priceSmall: null,
    priceMedium: null,
    priceLarge: 18,
    priceBainMarie: null,
    pricingType: 'SIZED' as const,
  },
  {
    name: 'Garlic Dip (Toum)',
    description: 'Traditional Lebanese garlic dip.',
    price: 12,
    priceSmall: null,
    priceMedium: null,
    priceLarge: 12,
    priceBainMarie: null,
    pricingType: 'SIZED' as const,
  },
] as const

async function main() {
  logDatabaseTarget(databaseUrl)

  const updated = await prisma.$transaction(async (tx) => {
    const counts: Record<string, number> = {}

    for (const row of DIP_UPDATES) {
      const matches = await tx.meal.findMany({ where: { name: row.name } })
      if (matches.length === 0) {
        throw new Error(`[patch-dip-prices] No meal named "${row.name}" — aborting, no rows updated.`)
      }
      if (matches.length > 1) {
        throw new Error(
          `[patch-dip-prices] Found ${matches.length} meals named "${row.name}" — aborting to avoid updating duplicates.`
        )
      }
      const meal = matches[0]
      if (meal.category !== 'Dips') {
        throw new Error(
          `[patch-dip-prices] "${row.name}" has category "${meal.category ?? '(null)'}" (expected "Dips") — aborting.`
        )
      }

      const result = await tx.meal.update({
        where: { id: meal.id },
        data: {
          description: row.description,
          price: row.price,
          priceSmall: row.priceSmall,
          priceMedium: row.priceMedium,
          priceLarge: row.priceLarge,
          priceBainMarie: row.priceBainMarie,
          pricingType: row.pricingType,
        },
      })
      counts[row.name] = result.id ? 1 : 0
    }

    return counts
  })

  const updatedCount = Object.values(updated).reduce((sum, n) => sum + n, 0)
  console.log('[patch-dip-prices] Updated rows:', updated)
  console.log(`[patch-dip-prices] Total records updated: ${updatedCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
