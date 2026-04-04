import type { Meal } from '@/hooks/useMeals'
import { dipTrayComboSizeLabel, isDipTrayComboMeal } from '@/lib/dipTrayCombo'

/** Customer-facing label for the food warmer add-on (sized mains & BBQ trays). */
export const FOOD_WARMER_OPTION_LABEL = 'Keep Food Warm – Add Warmer (+$55 per tray)'

/** Short supporting copy shown next to the warmer option in the UI. */
export const FOOD_WARMER_OPTION_DESCRIPTION =
  'Includes professional bain-marie equipment to keep your food warm and ready to serve during your event.'

export type CartSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE'

/**
 * Human-readable size / serving line for cart, checkout, and emails.
 * For dip combos, BAIN_MARIE is “Large tray”, not the food warmer add-on.
 */
export function cartLineSizeLabel(
  meal: Pick<Meal, 'name' | 'category' | 'pricingType'>,
  size: CartSize | null | undefined
): string {
  if (!size) return ''
  if (isDipTrayComboMeal(meal)) {
    return dipTrayComboSizeLabel(size)
  }
  if (meal.name.toLowerCase().includes('salad cup')) {
    if (size === 'SMALL') return 'Garden Salad'
    if (size === 'MEDIUM') return 'Fattoush'
    if (size === 'LARGE') return 'Tabouli'
    if (size === 'BAIN_MARIE') return FOOD_WARMER_OPTION_LABEL
  }
  if (size === 'SMALL') return 'Small'
  if (size === 'MEDIUM') return 'Medium'
  if (size === 'LARGE') return 'Large'
  if (size === 'BAIN_MARIE') return FOOD_WARMER_OPTION_LABEL
  return ''
}

/** Single line for order confirmation / admin when a size or warmer applies. */
export function formatOrderItemDisplayName(
  meal: Pick<Meal, 'name' | 'category' | 'pricingType'>,
  size: string | null | undefined
): string {
  if (!size) return meal.name
  const sl = cartLineSizeLabel(meal, size as CartSize)
  if (!sl) return meal.name
  return `${meal.name} — ${sl}`
}
