
// Run locally using: npm run db:seed
import './load-env'

import { MIN_DELIVERY_ZONE_ORDER } from '@/lib/checkoutConstants'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'

function requireDatabaseUrl(): string {
  const u = process.env.DATABASE_URL?.trim()
  if (!u) throw new Error('DATABASE_URL is not set')
  return u
}
const databaseUrl = requireDatabaseUrl()

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
} as any)

const BAIN_MARIE_FEE = 55

function logDatabaseTarget(url: string) {
  try {
    const normalized = url.replace(/^postgresql:/i, 'https:')
    const u = new URL(normalized)
    console.log(`[seed] DATABASE_URL → host: ${u.hostname} (path: ${u.pathname || '/'})`)
  } catch {
    console.log('[seed] DATABASE_URL is set (could not parse for logging)')
  }
}

async function main() {
  console.log('🌱 Starting seed...')
  logDatabaseTarget(databaseUrl)

  // ----- Admin User -----
  const admin = await prisma.user.upsert({
    where: { email: 'admin@catering.com' },
    update: {},
    create: {
      email: 'admin@catering.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })

  // ----- Sample Customer -----
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Doe',
      password: await bcrypt.hash('customer123', 10),
      role: 'CUSTOMER',
    },
  })

  console.log('✔ Created users')

  // Clear orders first — meals are referenced by order_items (FK), so deleteMany(meals) fails otherwise.
  // WARNING: removes all orders and line items (typical for local full reseed).
  const deletedItems = await prisma.orderItem.deleteMany({})
  const deletedOrders = await prisma.order.deleteMany({})
  console.log(`✔ Cleared orders (${deletedOrders.count} orders, ${deletedItems.count} line items)`)

  // Clear existing meals to avoid duplicates
  await prisma.meal.deleteMany({})

  // Image URL mapping function - maps meal names to local menu-images
  const getImageUrl = (mealName: string, category?: string): string => {
    const name = mealName.toLowerCase()

    // Item-specific overrides (must come first)
    // - Fish with tahini / Samke Harra
    if ((name.includes('samke') && name.includes('harra')) || (name.includes('fish') && name.includes('tahini'))) {
      return '/menu-images/samke-harra.png'
    }
    // - Stuffed Lebanese Zucchini (Kousa)
    if (name.includes('kousa') || name.includes('zucchini')) {
      return '/menu-images/koussa.png'
    }

    // Category-level defaults
    // Category-level overrides were avoided here so each item can use its own mapping.
    
    // Finger Food - Per Item
    if (name.includes('beef mini burger') || name.includes('beef burger')) {
      return '/menu-images/beef-burger.png'
    }
    if (name.includes('chicken mini burger') || name.includes('chicken burger')) {
      return '/menu-images/mini-chicken-burger.png'
    }
    if (name.includes('fish mini burger') || name.includes('fish burger') || name.includes('crumbed fish')) {
      return '/menu-images/mini-sliders.png'
    }
    if (name.includes('halloumi') && name.includes('turkish')) {
      return '/menu-images/turkish-halloumi.jpg'
    }
    if (name.includes('halloumi') && name.includes('wrap')) {
      return '/menu-images/mini-haloumi-wraps.png'
    }
    if (name.includes('halloumi')) {
      return '/menu-images/mini-halloumi.png'
    }
    if (name.includes('salmon') || name.includes('bagel')) {
      return '/menu-images/salmon bagel.png'
    }
    if (name.includes('croissant')) {
      return '/menu-images/mini-croissant.png'
    }
    if (name.includes('baguette')) {
      return '/menu-images/mini-bagguette.png'
    }
    if (name.includes('fajita')) {
      return '/menu-images/chicken-fajitas-wraps.png'
    }
    if (name.includes('chicken') && name.includes('wrap')) {
      return '/menu-images/chicken-fajitas-wraps.png'
    }
    if (name.includes('falafel') && name.includes('wrap')) {
      return '/menu-images/falafel-wrap.jpg'
    }
    if (name.includes('falafel')) {
      return '/menu-images/falafel.png'
    }
    if (name.includes('tempura') && name.includes('prawn')) {
      return '/menu-images/prawns-tempura.png'
    }
    
    // Finger Food - Per Dozen
    if (name.includes('kibbeh') && (name.includes('dozen') || name.includes('per dozen'))) {
      return '/menu-images/kibbeh-dozen.png'
    }
    if (name.includes('kibbeh naye') || name.includes('raw kibbeh')) {
      return '/menu-images/kibbeh_naye-.png'
    }
    if (name.includes('kibbeh') && name.includes('baked')) {
      return '/menu-images/kibbeh-tray.png'
    }
    if (name.includes('kibbeh')) {
      return '/menu-images/kibbeh-dozen.png'
    }
    if (name.includes('sambousik') || name.includes('sambousek')) {
      if (name.includes('cheese')) {
        return '/menu-images/Cheese-sambousek.png'
      }
      return '/menu-images/sambousik.png'
    }
    if (name.includes('pizza supreme')) {
      return '/menu-images/pizza-supreme.png'
    }
    if (name.includes('vegetarian pizza')) {
      return '/menu-images/pizza-veggie.png'
    }
    if (name.includes('cheese pizza')) {
      return '/menu-images/mini-cheese.png'
    }
    if (name.includes('zaatar pizza')) {
      return '/menu-images/mini zaatar.png'
    }
    if (name.includes('pizza')) {
      return '/menu-images/pizza-supreme.png'
    }
    if (name.includes('fatayer') || name.includes('spinach')) {
      return '/menu-images/spinash_fatayer.png'
    }
    if (name.includes('spring roll')) {
      return '/menu-images/vegetable spring rolls.png'
    }
    if (name.includes('cheese') && name.includes('ham') && name.includes('platter')) {
      return '/menu-images/cheese-and-ham.png'
    }
    
    // Salads
    if (name.includes('tabouli') || name.includes('tabbouleh')) {
      return '/menu-images/tabouleh.png'
    }
    if (name.includes('fattoush')) {
      return '/menu-images/fattouch.png'
    }
    if (name.includes('greek salad')) {
      return '/menu-images/greek-salad.png'
    }
    if (name.includes('seafood pasta salad')) {
      return '/menu-images/crab_pasta_salad.png'
    }
    if (name.includes('garden salad')) {
      return '/menu-images/green-salad.png'
    }
    if (name.includes('mixed bean salad')) {
      return '/menu-images/beans-salad.png'
    }
    if (name.includes('fruit platter')) {
      return '/menu-images/fruit-platter.png'
    }
    if (name.includes('caesar')) {
      return '/menu-images/chicken-caeser-salad.png'
    }
    if (name.includes('rocket') || name.includes('arugula')) {
      return '/menu-images/rocket-salad.png'
    }
    
    // Dips
    if (name.includes('hummus')) {
      return '/menu-images/hummus.png'
    }
    if (name.includes('garlic') || name.includes('toum')) {
      return '/menu-images/garlic.png'
    }
    if (name.includes('eggplant') || name.includes('baba ghanoush') || name.includes('baba ghanouj')) {
      return '/menu-images/baba ghanouj.jpeg'
    }
    if (
      name.includes('tahini') &&
      !name.includes('cauliflower') &&
      !name.includes('arnabit') &&
      !name.includes('arnabeet')
    ) {
      return '/menu-images/tahini.png'
    }
    
    // Trays (only when not already matched as a named dip tray above)
    if (name.includes('tray') && !name.includes('hummus') && !name.includes('toum') && !name.includes('garlic') &&
        !name.includes('eggplant') && !name.includes('baba') && !name.includes('tahini')) {
      return '/menu-images/kibbeh-tray.png'
    }
    
    // Pasta & Noodles
    if (name.includes('creamy chicken pasta')) {
      return '/menu-images/creamy chicken pasta.png'
    }
    if (name.includes('bolognese')) {
      return '/menu-images/pasta bolognese.png'
    }
    if (name.includes('lasagna') || name.includes('lasagne')) {
      return '/menu-images/lasagna-tray.jpeg'
    }
    if (name.includes('pesto')) {
      return '/menu-images/chicken-pesto-salad.png'
    }
    if (name.includes('arrabbiata')) {
      return '/menu-images/penne-arabiatta.png'
    }
    if (name.includes('beef') && name.includes('noodle')) {
      return '/menu-images/noodles with meat.jpeg'
    }
    if (name.includes('prawn') && name.includes('noodle')) {
      return '/menu-images/noodles with prawns.png'
    }
    if (name.includes('chicken') && name.includes('noodle')) {
      return '/menu-images/chicken noodles.png'
    }
    if (name.includes('noodle')) {
      return '/menu-images/chicken noodles.png'
    }
    
    // BBQ
    if (name.includes('lamb skewer')) {
      return '/menu-images/lamb skewer.png'
    }
    if (name.includes('chicken skewer') || name.includes('shish tawook')) {
      return '/menu-images/chicken-skewer.png'
    }
    if ((name.includes('kafta') || name.includes('kofta')) && name.includes('skewer')) {
      return '/menu-images/kafta-skewers.png'
    }
    if (name.includes('chicken wing')) {
      return '/menu-images/chicken-wings-grilled.png'
    }
    if (name.includes('mixed grill') || name.includes('bbq platter')) {
      return '/menu-images/bbq_mix.png'
    }
    
    // Mediterranean Mains
    if (name.includes('kibbeh naye') || name.includes('raw kibbeh')) {
      return '/menu-images/kibbeh_naye-.png'
    }
    if (name.includes('oven baked kibbeh') || name.includes('baked kibbeh')) {
      return '/menu-images/kibbeh-tray.png'
    }
    if (name.includes('fish') && name.includes('tahini')) {
      return '/menu-images/samke-harra.png'
    }
    if (name.includes('chicken with rice') || name.includes('riz a djej')) {
      return '/menu-images/rice with chicken -riz a djej.png'
    }
    if (name.includes('moghrabieh') || name.includes('moghrabiye') || name.includes('mograbieh')) {
      return '/menu-images/moghrabiye.png'
    }
    if (name.includes('mansaf') || name.includes('lamb with rice')) {
      return '/menu-images/rice with meat.png'
    }
    if (name.includes('vine leaves') && (name.includes('lamb') || name.includes('meat'))) {
      return '/menu-images/vine leaves with meat.jpeg'
    }
    if (name.includes('vine leaves')) {
      return '/menu-images/vg-vine_leaves.png'
    }
    if (name.includes('kafta') && name.includes('potato')) {
      return '/menu-images/kafta_w_batata.png'
    }
    if (name.includes('zucchini') || name.includes('kousa')) {
      return '/menu-images/koussa.png'
    }
    if (name.includes('stroganoff')) {
      return '/menu-images/chicken-stroganoff.png'
    }
    
    // Paella
    if (name.includes('paella')) {
      return '/menu-images/paella.png'
    }
    
    // Vegetarian Lebanese
    if (name.includes('vine leaves') && (name.includes('vegetarian') || category?.includes('Vegetarian'))) {
      return '/menu-images/vg-vine_leaves.png'
    }
    if (name.includes('fried rice')) {
      return '/menu-images/rice.jpeg'
    }
    if (name.includes('lentil') || name.includes('mujadara') || name.includes('mjadra')) {
      return '/menu-images/mjadra.png'
    }
    if (name.includes('batata harra')) {
      return '/menu-images/batata_harra1.png'
    }
    if (name.includes('potato') && name.includes('rice') && name.includes('batata')) {
      return '/menu-images/batata_harra1.png'
    }
    if (name.includes('potato') && name.includes('rice')) {
      return '/menu-images/batata_harra1.png'
    }
    if (name.includes('baked vegetable') || name.includes('vegetable bake')) {
      return '/menu-images/roasted-vegetables.png'
    }
    if (name.includes('cauliflower') || name.includes('arnabit') || name.includes('arnabeet')) {
      return '/menu-images/arnabeet.png'
    }
    
    // Desserts
    if (name.includes('granola') || name.includes('muesli')) {
      return '/menu-images/granola.png'
    }
    if (name.includes('fruit') && name.includes('cup')) {
      return '/menu-images/fruit-cups.png'
    }
    if (name.includes('cheesecake')) {
      return '/menu-images/cheesecake.png'
    }
    if (name.includes('tart') || name.includes('strawberry')) {
      return '/menu-images/tarte-strawberry.png'
    }
    if (name.includes('salad cup')) {
      return '/menu-images/mini salads.jpeg'
    }
    if (name.includes('salad') && name.includes('cup')) {
      return '/menu-images/mini salads.jpeg'
    }
    
    // Default placeholder for unmatched items (using a generic catering image if available)
    return '/menu-images/catering1 (1).jpeg'
  }

  // ----- Meals -----
  const mealsData: any[] = [
    // ========== FINGER FOOD (PER ITEM) ==========
    {
      name: 'Beef Mini Burger',
      description: 'Juicy beef patty in a mini bun',
      price: 7.00,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Chicken Mini Burger',
      description: 'Tender chicken patty in a mini bun',
      price: 7.00,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Crumbed Fish Mini Burger',
      description: 'Crispy crumbed fish in a mini bun',
      price: 7.00,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Halloumi Turkish Bread',
      description: 'Grilled halloumi on Turkish bread',
      price: 6.50,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: true,
    },
    {
      name: 'Salmon Mini Bagel',
      description: 'Smoked salmon on a mini bagel',
      price: 7.50,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Mini Croissant',
      description: 'Mini croissant with choice of filling',
      price: 6.50,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: true,
    },
    {
      name: 'Mini Baguette',
      description: 'Mini baguette with choice of filling',
      price: 6.50,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: true,
    },
    {
      name: 'Chicken Mini Wrap',
      description: 'Chicken in a mini wrap',
      price: 6.50,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Falafel Mini Wrap',
      description: 'Falafel in a mini wrap',
      price: 5.50,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Halloumi Mini Wrap',
      description: 'Halloumi in a mini wrap',
      price: 6.00,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: true,
    },
    {
      name: 'Chicken Fajita Wrap',
      description: 'Spiced chicken fajita in a wrap',
      price: 7.00,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Mini Kibbeh Cup (2 pieces)',
      description: 'Cup with 2 mini kibbeh. Perfect bite-sized catering option.',
      price: 5.50,
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
      price: 4.50,
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
      price: 4.50,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: true,
      isVegan: true,
      imageUrl: '/menu-images/vegetable spring rolls.png',
    },
    {
      name: 'Crispy Tempura Prawns with Dipping Sauce',
      description: 'Lightly battered prawns fried until crispy, served with dipping sauce',
      price: 3.80,
      category: 'Finger Food',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      minimumQuantity: 12,
      isVegetarian: false,
      imageUrl: '/menu-images/prawns-tempura.png',
    },
    {
      name: 'Cheese & Ham Platter',
      description: 'Assorted cheeses and cured meats, served with crackers and fresh garnishes.',
      price: 65.00,
      priceSmall: 65.00,
      priceMedium: 78.00,
      priceLarge: 95.00,
      category: 'Finger Food',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: false,
    },

    // ========== FINGER FOOD (PER DOZEN - 12 PIECES) ==========
    {
      name: 'Kibbeh (Per Dozen)',
      description: 'Traditional Lebanese kibbeh - 12 pieces',
      price: 30.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Meat Sambousik (Per Dozen)',
      description: 'Meat-filled pastries - 12 pieces',
      price: 28.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Cheese Sambousik (Per Dozen)',
      description: 'Cheese-filled pastries - 12 pieces',
      price: 26.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: true,
    },
    {
      name: 'Pizza Supreme (Per Dozen)',
      description: 'Supreme pizza slices - 12 pieces',
      price: 26.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },
    {
      name: 'Vegetarian Pizza (Per Dozen)',
      description: 'Vegetarian pizza slices - 12 pieces',
      price: 24.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: true,
    },
    {
      name: 'Cheese Pizza (Per Dozen)',
      description: 'Cheese pizza slices - 12 pieces',
      price: 24.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: true,
    },
    {
      name: 'Zaatar Pizza (Per Dozen)',
      description: 'Zaatar pizza slices - 12 pieces',
      price: 22.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Spinach Fatayer (Per Dozen)',
      description: 'Spinach-filled pastries - 12 pieces',
      price: 26.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: true,
    },
    {
      name: 'Vegetable Spring Rolls (Per Dozen)',
      description: 'Vegetable spring rolls - 12 pieces',
      price: 24.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Falafel Platter (Per Dozen)',
      description: 'Falafel platter - 12 pieces',
      price: 24.00,
      category: 'Finger Food',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: true,
      isVegan: true,
    },

    // ========== SALADS (SIZED: SMALL / MEDIUM / LARGE) ==========
    {
      name: 'Tabouli',
      description: 'Fresh parsley salad with bulgur, tomatoes, and lemon',
      price: 48.00, // Small price (base)
      priceSmall: 48.00,
      priceMedium: 58.00,
      priceLarge: 70.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Fattoush',
      description: 'Lebanese bread salad with mixed vegetables and sumac',
      price: 48.00,
      priceSmall: 48.00,
      priceMedium: 58.00,
      priceLarge: 70.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Greek Salad',
      description: 'Classic Greek salad with feta, olives, and vegetables',
      price: 48.00,
      priceSmall: 48.00,
      priceMedium: 58.00,
      priceLarge: 70.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
    },
    {
      name: 'Seafood Pasta Salad',
      description: 'Pasta salad with mixed seafood',
      price: 50.00,
      priceSmall: 50.00,
      priceMedium: 60.00,
      priceLarge: 75.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Fresh Garden Salad',
      description: 'Fresh garden salad served',
      price: 48.00,
      priceSmall: 48.00,
      priceMedium: 58.00,
      priceLarge: 70.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Mixed Bean Salad',
      description: 'Mixed beans with herbs and dressing',
      price: 48.00,
      priceSmall: 48.00,
      priceMedium: 58.00,
      priceLarge: 70.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Chicken Caesar Salad',
      description: 'Classic Caesar salad with grilled chicken',
      price: 52.00,
      priceSmall: 52.00,
      priceMedium: 62.00,
      priceLarge: 75.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: false,
    },
    {
      name: 'Rocket Salad',
      description: 'Fresh rocket leaves with dressing',
      price: 48.00,
      priceSmall: 48.00,
      priceMedium: 58.00,
      priceLarge: 70.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Fruit Platter',
      description: 'Fresh seasonal fruits, beautifully arranged for catering events.',
      price: 48.00,
      priceSmall: 48.00,
      priceMedium: 58.00,
      priceLarge: 75.00,
      category: 'Salads',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },

    // ========== DIPS & TRAYS (4 dips × 4 servings: medium dip, large dip, medium tray, large tray) ==========
    {
      name: 'Hummus',
      description:
        'Medium dip $13 · Large dip $18 · Medium tray $45 · Large tray $55. Choose your serving below.',
      price: 13.00,
      priceSmall: 13.00,
      priceMedium: 18.00,
      priceLarge: 50.00,
      priceBainMarie: 60.00,
      category: 'Dips',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Eggplant Dip (Baba Ghanoush)',
      description:
        'Medium dip $13 · Large dip $18 · Medium tray $45 · Large tray $55. Choose your serving below.',
      price: 13.00,
      priceSmall: 13.00,
      priceMedium: 18.00,
      priceLarge: 50.00,
      priceBainMarie: 60.00,
      category: 'Dips',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Garlic Dip (Toum)',
      description:
        'Medium dip $13 · Large dip $18 · Medium tray $45 · Large tray $55. Choose your serving below.',
      price: 13.00,
      priceSmall: 13.00,
      priceMedium: 18.00,
      priceLarge: 50.00,
      priceBainMarie: 60.00,
      category: 'Dips',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Tahini Dip',
      description:
        'Medium dip $13 · Large dip $18 · Medium tray $45 · Large tray $55. Choose your serving below.',
      price: 13.00,
      priceSmall: 13.00,
      priceMedium: 18.00,
      priceLarge: 50.00,
      priceBainMarie: 60.00,
      category: 'Dips',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },

    // ========== PASTA & NOODLE PLATTERS (SIZED: SMALL / MEDIUM / LARGE / BAIN-MARIE) ==========
    {
      name: 'Creamy Chicken Pasta',
      description: 'Creamy chicken pasta platter',
      price: 50.00,
      priceSmall: 50.00,
      priceMedium: 70.00,
      priceLarge: 95.00,
      priceBainMarie: 95.00,
      category: 'Pasta & Noodles',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Bolognese Pasta',
      description: 'Classic bolognese pasta platter',
      price: 50.00,
      priceSmall: 50.00,
      priceMedium: 70.00,
      priceLarge: 95.00,
      priceBainMarie: 95.00,
      category: 'Pasta & Noodles',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Lasagna',
      description: 'Traditional lasagna platter',
      price: 50.00,
      priceSmall: 50.00,
      priceMedium: 70.00,
      priceLarge: 95.00,
      priceBainMarie: 95.00,
      category: 'Pasta & Noodles',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Pesto Chicken Penne',
      description: 'Pesto chicken penne platter',
      price: 50.00,
      priceSmall: 50.00,
      priceMedium: 70.00,
      priceLarge: 95.00,
      priceBainMarie: 95.00,
      category: 'Pasta & Noodles',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Penne Arrabbiata',
      description: 'Spicy penne arrabbiata platter',
      price: 50.00,
      priceSmall: 50.00,
      priceMedium: 70.00,
      priceLarge: 95.00,
      priceBainMarie: 95.00,
      category: 'Pasta & Noodles',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Chicken & Vegetable Noodles',
      description: 'Chicken and vegetable noodle platter',
      price: 50.00,
      priceSmall: 50.00,
      priceMedium: 70.00,
      priceLarge: 95.00,
      priceBainMarie: 95.00,
      category: 'Pasta & Noodles',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Beef & Vegetable Noodles',
      description: 'Beef and vegetable noodle platter',
      price: 50.00,
      priceSmall: 50.00,
      priceMedium: 70.00,
      priceLarge: 100.00,
      priceBainMarie: 100.00,
      category: 'Pasta & Noodles',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Prawn & Vegetable Noodles',
      description: 'Prawn and vegetable noodle platter',
      price: 55.00,
      priceSmall: 55.00,
      priceMedium: 75.00,
      priceLarge: 100.00,
      priceBainMarie: 100.00,
      category: 'Pasta & Noodles',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },

    // ========== BBQ (PER SKEWER / PER DOZEN) ==========
    {
      name: 'Lamb Skewers',
      description: 'Grilled lamb skewers (optional Keep Food Warm – Add Warmer +$55 per tray)',
      price: 9.00,
      category: 'BBQ',
      pricingType: 'PER_SKEWER' as const,
      mealType: 'EVENT' as const,
      hasBainMarie: true,
      bainMarieFee: BAIN_MARIE_FEE,
      isVegetarian: false,
    },
    {
      name: 'Chicken Skewers (Shish Tawook)',
      description: 'Marinated chicken skewers (optional Keep Food Warm – Add Warmer +$55 per tray)',
      price: 7.00,
      category: 'BBQ',
      pricingType: 'PER_SKEWER' as const,
      mealType: 'EVENT' as const,
      hasBainMarie: true,
      bainMarieFee: BAIN_MARIE_FEE,
      isVegetarian: false,
    },
    {
      name: 'Kafta Skewers',
      description: 'Spiced meat skewers (optional Keep Food Warm – Add Warmer +$55 per tray)',
      price: 7.00,
      category: 'BBQ',
      pricingType: 'PER_SKEWER' as const,
      mealType: 'EVENT' as const,
      hasBainMarie: true,
      bainMarieFee: BAIN_MARIE_FEE,
      isVegetarian: false,
    },
    {
      name: 'Chicken Wings (Per Dozen)',
      description: 'BBQ chicken wings - 12 pieces (optional Keep Food Warm – Add Warmer +$55 per tray)',
      price: 24.00,
      category: 'BBQ',
      pricingType: 'PER_DOZEN' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 1,
      hasBainMarie: true,
      bainMarieFee: BAIN_MARIE_FEE,
      isVegetarian: false,
    },

    // ========== MEDITERRANEAN MAIN PLATTERS (SIZED: SMALL / MEDIUM / LARGE / BAIN-MARIE +$55) ==========
    {
      name: 'Kibbeh Naye',
      description: 'Raw kibbeh platter',
      price: 60.00,
      priceSmall: 60.00,
      priceMedium: 80.00,
      priceLarge: 100.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Oven Baked Kibbeh',
      description: 'Baked kibbeh platter',
      price: 60.00,
      priceSmall: 60.00,
      priceMedium: 80.00,
      priceLarge: 100.00,
      priceBainMarie: 100.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Fish with Tahini (Samke Harra)',
      description: 'Spiced fish with tahini sauce',
      price: 65.00,
      priceSmall: 65.00,
      priceMedium: 85.00,
      priceLarge: 105.00,
      priceBainMarie: 105.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Riz a Djej (Chicken with Rice)',
      description: 'Lebanese chicken and rice platter',
      price: 65.00,
      priceSmall: 65.00,
      priceMedium: 85.00,
      priceLarge: 105.00,
      priceBainMarie: 105.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Moghrabieh',
      description: 'Lebanese pearl couscous with chickpeas and spices',
      price: 70.00,
      priceSmall: 70.00,
      priceMedium: 90.00,
      priceLarge: 115.00,
      priceBainMarie: 115.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Mansaf Lamb with Rice',
      description: 'Traditional lamb mansaf with rice',
      price: 70.00,
      priceSmall: 70.00,
      priceMedium: 90.00,
      priceLarge: 115.00,
      priceBainMarie: 115.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Vine Leaves with Lamb Chops',
      description: 'Stuffed vine leaves with lamb chops',
      price: 75.00,
      priceSmall: 75.00,
      priceMedium: 95.00,
      priceLarge: 115.00,
      priceBainMarie: 115.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Kafta with Potatoes',
      description: 'Spiced meat with potatoes',
      price: 60.00,
      priceSmall: 60.00,
      priceMedium: 80.00,
      priceLarge: 95.00,
      priceBainMarie: 95.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Stuffed Lebanese Zucchini (Kousa)',
      description: 'Stuffed zucchini with rice and meat',
      price: 65.00,
      priceSmall: 65.00,
      priceMedium: 85.00,
      priceLarge: 105.00,
      priceBainMarie: 105.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },
    {
      name: 'Chicken Stroganoff',
      description: 'Creamy chicken stroganoff platter',
      price: 65.00,
      priceSmall: 65.00,
      priceMedium: 85.00,
      priceLarge: 105.00,
      priceBainMarie: 105.00,
      category: 'Mediterranean Mains',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: false,
    },

    // ========== PAELLA (PER PERSON) ==========
    {
      name: 'Paella',
      description: 'Traditional Spanish paella - per person (minimum 12 people)',
      price: 27.00,
      category: 'Paella',
      pricingType: 'PER_PERSON' as const,
      mealType: 'EVENT' as const,
      minimumQuantity: 12,
      isVegetarian: false,
    },

    // ========== VEGETARIAN LEBANESE PLATTERS (SIZED: SMALL / MEDIUM / LARGE / BAIN-MARIE +$55) ==========
    {
      name: 'Vine Leaves (Vegetarian)',
      description: 'Stuffed vine leaves - vegetarian',
      price: 60.00,
      priceSmall: 60.00,
      priceMedium: 75.00,
      priceLarge: 95.00,
      priceBainMarie: null,
      category: 'Vegetarian Lebanese',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Fried Rice',
      description: 'Lebanese fried rice platter',
      price: 55.00,
      priceSmall: 55.00,
      priceMedium: 70.00,
      priceLarge: 85.00,
      priceBainMarie: 85.00,
      category: 'Vegetarian Lebanese',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Lentils with Rice (Mujadara)',
      description: 'Lentils and rice platter',
      price: 55.00,
      priceSmall: 55.00,
      priceMedium: 70.00,
      priceLarge: 85.00,
      priceBainMarie: null,
      category: 'Vegetarian Lebanese',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Batata Harra',
      description: 'Fried spiced potatoes',
      price: 55.00,
      priceSmall: 55.00,
      priceMedium: 70.00,
      priceLarge: 85.00,
      priceBainMarie: 85.00,
      category: 'Vegetarian Lebanese',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Baked Vegetables',
      description: 'Assorted baked vegetables',
      price: 55.00,
      priceSmall: 55.00,
      priceMedium: 70.00,
      priceLarge: 85.00,
      priceBainMarie: 85.00,
      category: 'Vegetarian Lebanese',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Fried Cauliflower with Tahini (Arnabit)',
      description: 'Crispy fried cauliflower served with tahini sauce',
      price: 55.00,
      priceSmall: 55.00,
      priceMedium: 70.00,
      priceLarge: 85.00,
      priceBainMarie: 85.00,
      category: 'Vegetarian Lebanese',
      pricingType: 'SIZED' as const,
      mealType: 'EVENT' as const,
      isVegetarian: true,
      isVegan: true,
    },

    // ========== DESSERTS (PER ITEM) ==========
    {
      name: 'Granola (Muesli, Yogurt & Fruit)',
      description: 'Fresh granola with yogurt and fruit',
      price: 6.50,
      category: 'Desserts & Cups',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
    },
    {
      name: 'Fruit Cups',
      description: 'Fresh mixed fruit in a cup',
      price: 6.50,
      category: 'Desserts & Cups',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
      isVegan: true,
    },
    // (Fresh Garden Salad Cup moved to Salads section above)
    {
      name: 'Salad Cup',
      description: 'Choose Garden Salad, Fattoush or Tabouli',
      price: 6.50,
      category: 'Desserts & Cups',
      pricingType: 'SIZED' as const,
      mealType: 'BOTH' as const,
      priceSmall: 6.50,
      priceMedium: 6.50,
      priceLarge: 6.50,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Cheesecake',
      description: 'Creamy cheesecake slice',
      price: 7.50,
      category: 'Desserts & Cups',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
    },
    {
      name: 'Strawberry Tart',
      description: 'Fresh strawberry tart',
      price: 7.50,
      category: 'Desserts & Cups',
      pricingType: 'PER_ITEM' as const,
      mealType: 'BOTH' as const,
      isVegetarian: true,
    },
  ]

  // Add default values for all meals, including image URLs
  const mealsWithDefaults = mealsData.map(meal => {
    const persistedMeal = { ...(meal as any) }
    delete persistedMeal.hasBainMarie
    delete persistedMeal.bainMarieFee
    return {
      ...persistedMeal,
      isAvailable: true,
      containsEgg: persistedMeal.containsEgg ?? false,
      containsWheat: persistedMeal.containsWheat ?? false,
      containsPeanut: persistedMeal.containsPeanut ?? false,
      isVegan: persistedMeal.isVegan ?? false,
      isVegetarian: persistedMeal.isVegetarian ?? false,
      isGlutenFree: persistedMeal.isGlutenFree ?? false,
      ingredients: persistedMeal.ingredients ?? null,
      allergyNotes: persistedMeal.allergyNotes ?? null,
      isNDISReady: persistedMeal.isNDISReady ?? false,
      imageUrl: persistedMeal.imageUrl ?? getImageUrl(persistedMeal.name, persistedMeal.category),
      minimumQuantity: persistedMeal.minimumQuantity ?? null,
      priceSmall: persistedMeal.priceSmall ?? null,
      priceMedium: persistedMeal.priceMedium ?? null,
      priceLarge: persistedMeal.priceLarge ?? null,
      priceBainMarie: persistedMeal.priceBainMarie ?? null,
    }
  })

  await prisma.meal.createMany({
    data: mealsWithDefaults as any,
  })

  console.log(`✔ Created ${mealsWithDefaults.length} meals`)

  // ----- Events -----
  const event = await prisma.event.create({
    data: {
      name: 'Private Birthday Catering',
      description: 'Catering service for private parties or birthdays.',
      date: new Date('2025-02-10'),
      location: 'Sydney',
      maxGuests: 50,
    },
  })

  console.log('✔ Created one demo event')

  // ----- Delivery zones: two tiers only -----
  // Zone 1: under ~20 km from Punchbowl — $15 | Zone 2: ~20 km and beyond — $25
  // One row per (postcode + suburb) for checkout matching; curated lists, not live distance.
  const zone1Postcodes = [
    { postcode: '2196', suburb: 'Punchbowl' },
    // Same postcode (2196) — Roselands is Zone 1 $15 (adjacent to Punchbowl)
    { postcode: '2196', suburb: 'Roselands' },
    { postcode: '2134', suburb: 'Burwood' },
    { postcode: '2135', suburb: 'Strathfield' },
    { postcode: '2137', suburb: 'Concord West' },
    // Bankstown
    { postcode: '2200', suburb: 'Bankstown' },
    { postcode: '2201', suburb: 'Bankstown Central' },
    // Parramatta (core areas)
    { postcode: '2150', suburb: 'Parramatta' },
    { postcode: '2151', suburb: 'Parramatta West' },
    { postcode: '2152', suburb: 'North Parramatta' },
    // Inner West Sydney
    { postcode: '2040', suburb: 'Leichhardt' },
    { postcode: '2041', suburb: 'Lilyfield' },
    { postcode: '2042', suburb: 'Rozelle' },
    { postcode: '2043', suburb: 'Balmain' },
    { postcode: '2044', suburb: 'Drummoyne' },
    { postcode: '2045', suburb: 'Five Dock' },
    { postcode: '2046', suburb: 'Abbotsford' },
    { postcode: '2047', suburb: 'Canada Bay' },
    { postcode: '2048', suburb: 'Concord' },
    { postcode: '2049', suburb: 'Mortlake' },
    { postcode: '2050', suburb: 'North Strathfield' },
    // Inner West (Ashfield / Croydon)
    { postcode: '2131', suburb: 'Ashfield' },
    { postcode: '2132', suburb: 'Croydon' },
    // South West Sydney
    { postcode: '2168', suburb: 'Liverpool' },
    { postcode: '2170', suburb: 'Fairfield' },
    { postcode: '2171', suburb: 'Cabramatta' },
    { postcode: '2172', suburb: 'Canley Vale' },
    { postcode: '2173', suburb: 'Canley Heights' },
    // ~10 km from Punchbowl — within 20 km band
    { postcode: '2212', suburb: 'Revesby' },
    // ~5–8 km from Punchbowl — within 20 km band (was Zone 2; aligned with local pricing)
    { postcode: '2166', suburb: 'Greenacre' },
    // Canterbury corridor — close to Punchbowl / Greenacre band ($15)
    { postcode: '2191', suburb: 'Belfield' },
  ]

  // Zone 2: ~20 km and beyond from Punchbowl — $25 delivery fee
  const zone2Postcodes = [
    // Additional South West / Canterbury corridor
    { postcode: '2190', suburb: 'Belmore' },
    { postcode: '2192', suburb: 'Campsie' },
    { postcode: '2193', suburb: 'Hurlstone Park' },
    { postcode: '2193', suburb: 'Canterbury' },
    { postcode: '2194', suburb: 'Earlwood' },
    { postcode: '2195', suburb: 'Bardwell Park' },
    // Sutherland Shire
    { postcode: '2228', suburb: 'Miranda' },
    // Sydney CBD (multiple suburb labels per postcode so customers can match how they type)
    { postcode: '2000', suburb: 'Sydney CBD (City Centre, Central, Circular Quay, The Rocks)' },
    { postcode: '2001', suburb: 'Sydney CBD (Haymarket, Chinatown)' },
    { postcode: '2000', suburb: 'CBD' },
    { postcode: '2000', suburb: 'Sydney' },
    { postcode: '2001', suburb: 'CBD' },
    // North Shore (Mosman is 2088 — not 2028; Double Bay is 2028)
    { postcode: '2060', suburb: 'North Sydney' },
    { postcode: '2088', suburb: 'Mosman' },
    { postcode: '2089', suburb: 'Neutral Bay' },
    { postcode: '2090', suburb: 'Cremorne' },
    // Eastern Suburbs / harbour
    { postcode: '2030', suburb: 'Vaucluse / Watsons Bay' },
    { postcode: '2028', suburb: 'Double Bay' },
    { postcode: '2029', suburb: 'Rose Bay' },
    { postcode: '2027', suburb: 'Edgecliff' },
    { postcode: '2025', suburb: 'Woollahra' },
    { postcode: '2024', suburb: 'Bronte' },
    { postcode: '2021', suburb: 'Paddington' },
    { postcode: '2011', suburb: 'Potts Point' },
    { postcode: '2026', suburb: 'Bondi' },
    { postcode: '2026', suburb: 'Bondi Beach' },
    { postcode: '2022', suburb: 'Bondi Junction' },
    { postcode: '2031', suburb: 'Randwick' },
  ]

  // One row per (postcode, suburb); do not collapse by postcode — same postcode can serve multiple suburbs.
  const allZones = [
    ...zone1Postcodes.map((z) => ({ ...z, zone: 1 as const })),
    ...zone2Postcodes.map((z) => ({ ...z, zone: 2 as const })),
  ]

  // Remove legacy row: Mosman is 2088, not 2028 (Double Bay). Prevents confusion from old seeds.
  await prisma.deliveryZone.deleteMany({
    where: { postcode: '2028', suburb: 'Mosman / Double Bay' },
  })

  // Create delivery zones (skip if already exists)
  for (const zone of allZones) {
    const existing = await prisma.deliveryZone.findFirst({
      where: { postcode: zone.postcode, suburb: zone.suburb },
    })

    const deliveryFee = zone.zone === 1 ? 15 : 25 // Zone 1: $15, Zone 2: $25
    const minimumOrder = MIN_DELIVERY_ZONE_ORDER

    if (!existing) {
      await prisma.deliveryZone.create({
        data: {
          postcode: zone.postcode,
          suburb: zone.suburb,
          isActive: true,
          deliveryFee,
          minimumOrder,
        },
      })
    } else {
      // Update existing zone to ensure it's active and has pricing
      await prisma.deliveryZone.update({
        where: { id: existing.id },
        data: {
          suburb: zone.suburb,
          isActive: true,
          deliveryFee,
          minimumOrder,
        },
      })
    }
  }

  // Force correct fee on every row matching seed (handles duplicate rows + stale fees).
  for (const zone of allZones) {
    const fee = zone.zone === 1 ? 15 : 25
    await prisma.deliveryZone.updateMany({
      where: { postcode: zone.postcode, suburb: zone.suburb },
      data: { deliveryFee: fee, minimumOrder: MIN_DELIVERY_ZONE_ORDER, isActive: true },
    })
  }

  // Only two price tiers: $15 or $25. Any legacy/admin value (e.g. 35) becomes $25.
  await prisma.deliveryZone.updateMany({
    where: { deliveryFee: { notIn: [15, 25] } },
    data: { deliveryFee: 25 },
  })

  // Align minimum order (e.g. legacy $90) to current checkout minimum.
  await prisma.deliveryZone.updateMany({
    where: { minimumOrder: { not: MIN_DELIVERY_ZONE_ORDER } },
    data: { minimumOrder: MIN_DELIVERY_ZONE_ORDER },
  })

  const zone1Count = allZones.filter((z) => z.zone === 1).length
  const zone2Count = allZones.filter((z) => z.zone === 2).length
  console.log(`✔ Created/updated ${allZones.length} delivery zones (Zone 1 $15: ${zone1Count}, Zone 2 $25: ${zone2Count})`)

  const feeCheck = await prisma.deliveryZone.groupBy({
    by: ['deliveryFee'],
    _count: { _all: true },
  })
  console.log('[seed] delivery_zones fee counts:', feeCheck)
  const badFees = await prisma.deliveryZone.count({
    where: { deliveryFee: { notIn: [15, 25] } },
  })
  if (badFees > 0) {
    console.warn(`[seed] WARNING: ${badFees} rows still have deliveryFee not 15 or 25 — run clamp again or inspect DB`)
  }

  console.log('🌱 Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
