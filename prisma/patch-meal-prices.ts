/**
 * Applies the Fruit Platter + Cheese & Ham Platter price updates to the live DB.
 * Run: npm run db:patch-prices
 *
 * (Editing prisma/seed.ts alone does not change existing database rows.)
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
  const fruit = await prisma.meal.updateMany({
    where: { name: 'Fruit Platter' },
    data: {
      priceLarge: 75.0,
    },
  })

  const platter = await prisma.meal.updateMany({
    where: { name: 'Cheese & Ham Platter' },
    data: {
      price: 65.0,
      priceSmall: 65.0,
      priceMedium: 78.0,
      priceLarge: 95.0,
    },
  })

  const vineLeavesCup = await prisma.meal.updateMany({
    where: { name: 'Vine Leaves Cup (2 pieces - Vegetarian)' },
    data: {
      price: 6.5,
    },
  })

  const mixPizzaImg = '/menu-images/finger-food-mix-pizza.jpeg'
  const vegetableSpringRollsImg = '/menu-images/vegetable spring rolls.png'

  const mixedPastry = await prisma.meal.updateMany({
    where: { name: 'Mixed Pastry Cup (3 items)' },
    data: {
      price: 10.5,
      imageUrl: mixPizzaImg,
    },
  })

  const springRollsCup = await prisma.meal.updateMany({
    where: { name: 'Vegetable Spring Rolls Cup (2 pieces)' },
    data: {
      imageUrl: vegetableSpringRollsImg,
    },
  })

  console.log('Updated rows:', {
    fruitPlatter: fruit.count,
    cheeseHamPlatter: platter.count,
    vineLeavesCup: vineLeavesCup.count,
    mixedPastryCup: mixedPastry.count,
    vegetableSpringRollsCup: springRollsCup.count,
  })

  if (fruit.count === 0) {
    console.warn('No meal named "Fruit Platter" found — run db:seed or check your database.')
  }
  if (platter.count === 0) {
    console.warn('No meal named "Cheese & Ham Platter" found — run db:seed or check your database.')
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
