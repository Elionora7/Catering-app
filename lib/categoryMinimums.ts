import type { Meal } from '@/hooks/useMeals'

/** Must match `Meal.category` in seed / DB for desserts and cup products. */
export const DESSERTS_CUPS_CATEGORY = 'Desserts & Cups'

export const DESSERTS_CUPS_MIN_ORDER_QUANTITY = 12

/**
 * Single source of truth for minimum order quantity per line item (menu, cart, checkout, API).
 */
export function getMealMinimumQuantity(
  meal: Pick<Meal, 'name' | 'category' | 'pricingType' | 'minimumQuantity'>
): number {
  const name = meal.name.toLowerCase()
  const isBbq = meal.category?.toLowerCase() === 'bbq'
  const isChickenWings = name.includes('wing')

  if (isChickenWings) return 1
  if (meal.pricingType === 'PER_DOZEN') return 1
  if (isBbq && name.includes('skewer')) return 10
  if (meal.category === 'Finger Food' && meal.pricingType === 'PER_ITEM' && !isChickenWings) return 12
  if (meal.category === DESSERTS_CUPS_CATEGORY) return DESSERTS_CUPS_MIN_ORDER_QUANTITY
  return meal.minimumQuantity ?? 1
}
