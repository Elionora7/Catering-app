import { prisma } from '@/lib/prisma'
import { findActiveDeliveryZone } from '@/lib/deliveryZoneLookup'
import { shouldChargeBainMarieServiceFee } from '@/lib/dipTrayCombo'

export const STRIPE_FEE_PERCENT = 0.035
export const BAIN_MARIE_SERVICE_FEE = 55

type PricingItemInput = {
  mealId: string
  quantity: number
  size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null
}

type ComputePricingArgs = {
  items: PricingItemInput[]
  deliveryType: 'DELIVERY' | 'PICKUP'
  postcode?: string
  suburb?: string
  paymentMethod: 'STRIPE' | 'BANK_TRANSFER'
}

export async function computeOrderPricing(args: ComputePricingArgs) {
  const { items, deliveryType, postcode, suburb, paymentMethod } = args

  if (!items || items.length === 0) {
    throw new Error('At least one cart item is required')
  }

  // Same meal can appear on multiple lines (e.g. different sizes); query unique IDs only.
  const uniqueMealIds = [...new Set(items.map((item) => item.mealId))]
  const meals = await prisma.meal.findMany({
    where: {
      id: { in: uniqueMealIds },
      isAvailable: true,
    },
  })

  if (meals.length !== uniqueMealIds.length) {
    const foundIds = new Set(meals.map((m) => m.id))
    const missing = uniqueMealIds.filter((id) => !foundIds.has(id))
    console.error('[computeOrderPricing] Cart references meals that are missing or not available:', {
      missingIds: missing,
      requestedCount: uniqueMealIds.length,
      foundCount: meals.length,
    })
    throw new Error('One or more meals not found or unavailable')
  }

  const mealMap = new Map(meals.map((meal) => [meal.id, meal]))
  let subtotal = 0

  for (const item of items) {
    const meal = mealMap.get(item.mealId)
    if (!meal) throw new Error(`Meal ${item.mealId} not found`)

    let itemPrice = meal.price
    if (meal.pricingType === 'SIZED' && item.size) {
      if (item.size === 'SMALL' && meal.priceSmall !== null) itemPrice = meal.priceSmall
      else if (item.size === 'MEDIUM' && meal.priceMedium !== null) itemPrice = meal.priceMedium
      else if (item.size === 'LARGE' && meal.priceLarge !== null) itemPrice = meal.priceLarge
      else if (item.size === 'BAIN_MARIE' && meal.priceBainMarie !== null) itemPrice = meal.priceBainMarie
    }

    const bainMarieFee = shouldChargeBainMarieServiceFee(meal, item.size) ? BAIN_MARIE_SERVICE_FEE : 0
    subtotal += (itemPrice * item.quantity) + (bainMarieFee * item.quantity)
  }

  let deliveryFee = 0
  if (deliveryType === 'DELIVERY') {
    if (!postcode || !suburb) throw new Error('Postcode and suburb are required for delivery')
    const deliveryZone = await findActiveDeliveryZone(postcode.trim(), suburb.trim())
    if (!deliveryZone) throw new Error('We do not currently deliver to your area.')
    if (subtotal < deliveryZone.minimumOrder) {
      throw new Error(`Minimum order for this area is $${deliveryZone.minimumOrder.toFixed(2)}`)
    }
    deliveryFee = deliveryZone.deliveryFee
  }

  const baseTotal = Number((subtotal + deliveryFee).toFixed(2))
  const stripeFee =
    paymentMethod === 'STRIPE'
      ? Math.round(baseTotal * STRIPE_FEE_PERCENT * 100) / 100
      : 0
  const finalTotal = Math.round((baseTotal + stripeFee) * 100) / 100

  return { subtotal: Number(subtotal.toFixed(2)), deliveryFee, baseTotal, stripeFee, finalTotal }
}
