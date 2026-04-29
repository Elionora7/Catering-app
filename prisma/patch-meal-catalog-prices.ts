/**
 * Applies meal catalog price updates to match prisma/seed.ts — safe for production.
 * Does not delete orders or other tables; only updates named meals.
 *
 * Run (with DATABASE_URL pointing at the target DB, e.g. production):
 *   npm run db:patch-meal-catalog
 *
 * Updates:
 * - Salmon Mini Bagel → $7.00
 * - Vine Leaves Cup (2 pieces - Vegetarian) → $6.00
 * - Granola (Muesli, Yogurt & Fruit) → $6.00
 * - Fruit Cups → $6.00
 * - Salad Cup → $6.00, PER_ITEM, clear size-tier columns (was SIZED with identical tiers)
 * - Cheesecake → $7.00
 * - Strawberry Tart → $7.00
 */
import './load-env'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set')

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
} as any)

async function main() {
  const salmon = await prisma.meal.updateMany({
    where: { name: 'Salmon Mini Bagel' },
    data: { price: 7.0 },
  })

  const vineCup = await prisma.meal.updateMany({
    where: { name: 'Vine Leaves Cup (2 pieces - Vegetarian)' },
    data: { price: 6.0 },
  })

  const granola = await prisma.meal.updateMany({
    where: { name: 'Granola (Muesli, Yogurt & Fruit)' },
    data: { price: 6.0 },
  })

  const fruitCups = await prisma.meal.updateMany({
    where: { name: 'Fruit Cups' },
    data: { price: 6.0 },
  })

  const saladCup = await prisma.meal.updateMany({
    where: { name: 'Salad Cup' },
    data: {
      price: 6.0,
      pricingType: 'PER_ITEM',
      priceSmall: null,
      priceMedium: null,
      priceLarge: null,
      priceBainMarie: null,
    },
  })

  const cheesecake = await prisma.meal.updateMany({
    where: { name: 'Cheesecake' },
    data: { price: 7.0 },
  })

  const strawberryTart = await prisma.meal.updateMany({
    where: { name: 'Strawberry Tart' },
    data: { price: 7.0 },
  })

  const summary = {
    salmonMiniBagel: salmon.count,
    vineLeavesCup: vineCup.count,
    granola: granola.count,
    fruitCups: fruitCups.count,
    saladCup: saladCup.count,
    cheesecake: cheesecake.count,
    strawberryTart: strawberryTart.count,
  }

  console.log('[patch-meal-catalog-prices] Updated rows:', summary)

  const missing = Object.entries(summary).filter(([, n]) => n === 0).map(([k]) => k)
  if (missing.length > 0) {
    console.warn(
      '[patch-meal-catalog-prices] No rows matched for:',
      missing.join(', '),
      '— check meal names in the database vs seed.',
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
