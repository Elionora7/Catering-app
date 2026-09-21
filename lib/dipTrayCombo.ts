import type { Meal } from '@/hooks/useMeals'

const DIP_TRAY_COMBO_NAMES = new Set([
  'Hummus',
  'Eggplant Dip (Baba Ghanoush)',
  'Garlic Dip (Toum)',
  'Tahini Dip',
])

const BBQ_BAIN_MARIE_NAMES = new Set([
  'Lamb Skewers',
  'Chicken Skewers (Shish Tawook)',
  'Kafta Skewers',
  'Chicken Wings (Per Dozen)',
])

export function isDipTrayComboMeal(meal: Pick<Meal, 'name' | 'category'>) {
  return meal.category === 'Dips' && DIP_TRAY_COMBO_NAMES.has(meal.name)
}

export function isBbqBainMarieEligibleMeal(meal: Pick<Meal, 'name' | 'category'>) {
  return meal.category === 'BBQ' && BBQ_BAIN_MARIE_NAMES.has(meal.name)
}

/**
 * Customer-facing serving labels for named Dips.
 * Current catalog uses LARGE (dip) and optionally BAIN_MARIE (tray).
 * SMALL / MEDIUM remain labeled for historical cart/order rows only.
 */
export function dipTrayComboSizeLabel(size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE') {
  switch (size) {
    case 'SMALL':
      return 'Medium dip (legacy)'
    case 'MEDIUM':
      return 'Large dip (legacy)'
    case 'LARGE':
      return 'Large Dip — 500 g'
    case 'BAIN_MARIE':
      return 'Tray — serves 10–12'
    default:
      return size
  }
}

/** True when BAIN_MARIE is the pasta/noodle bain-marie add-on ($55), not the dip tray option */
export function shouldChargeBainMarieServiceFee(
  meal: Pick<Meal, 'name' | 'category' | 'pricingType'>,
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null | undefined
) {
  if (size !== 'BAIN_MARIE') return false
  if (isDipTrayComboMeal(meal)) return false
  return meal.pricingType === 'SIZED' || isBbqBainMarieEligibleMeal(meal)
}
