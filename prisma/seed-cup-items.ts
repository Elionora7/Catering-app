/**
 * Inserts the 5 "cup" finger-food items if they are missing (by exact name).
 * Safe when you cannot run full `db:seed` (e.g. you need to keep existing orders).
 *
 * Run: npm run db:seed-cups
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

const CUP_ITEMS = [
  {
    name: 'Mini Kibbeh Cup (2 pieces)',
    description: 'Cup with 2 mini kibbeh. Perfect bite-sized catering option.',
    price: 5.5,
    category: 'Finger Food',
    pricingType: 'PER_ITEM' as const,
    mealType: 'BOTH' as const,
    minimumQuantity: 12,
    isVegetarian: false,
    imageUrl: '/menu-images/finger-food-Kebbe.png',
  },
  {
    name: 'Mini Falafel Cup (2 pieces)',
    description: 'Cup with 2 crispy falafel. Vegetarian-friendly option.',
    price: 4.5,
    category: 'Finger Food',
    pricingType: 'PER_ITEM' as const,
    mealType: 'BOTH' as const,
    minimumQuantity: 12,
    isVegetarian: true,
    isVegan: true,
    imageUrl: '/menu-images/finger-food-Kebbe.png',
  },
  {
    name: 'Vine Leaves Cup (2 pieces - Vegetarian)',
    description: 'Cup with 2 stuffed vine leaves (vegetarian).',
    price: 6.50,
    category: 'Finger Food',
    pricingType: 'PER_ITEM' as const,
    mealType: 'BOTH' as const,
    minimumQuantity: 12,
    isVegetarian: true,
    imageUrl: '/menu-images/finger-food-veg-vine.jpeg',
  },
  {
    name: 'Mixed Pastry Cup (3 items)',
    description: 'Cup with a mix of cheese roll, meat sambousik, and kibbeh.',
    price: 10.50,
    category: 'Finger Food',
    pricingType: 'PER_ITEM' as const,
    mealType: 'BOTH' as const,
    minimumQuantity: 12,
    isVegetarian: false,
    imageUrl: '/menu-images/finger-food-mix-pizza.jpeg',
  },
  {
    name: 'Vegetable Spring Rolls Cup (2 pieces)',
    description: 'Cup with 2 vegetable spring rolls.',
    price: 4.5,
    category: 'Finger Food',
    pricingType: 'PER_ITEM' as const,
    mealType: 'BOTH' as const,
    minimumQuantity: 12,
    isVegetarian: true,
    isVegan: true,
    imageUrl: '/menu-images/vegetable spring rolls.png',
  },
] as const

async function main() {
  let created = 0
  let updatedImages = 0
  let skipped = 0

  for (const row of CUP_ITEMS) {
    const existing = await prisma.meal.findFirst({ where: { name: row.name } })
    if (existing) {
      if (existing.imageUrl !== row.imageUrl) {
        await prisma.meal.update({
          where: { id: existing.id },
          data: { imageUrl: row.imageUrl },
        })
        updatedImages++
      } else {
        skipped++
      }
      continue
    }
    await prisma.meal.create({ data: { ...row } })
    created++
  }

  console.log('Cup items:', { created, updatedImages, skipped, total: CUP_ITEMS.length })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
