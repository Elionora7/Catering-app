'use client'

import { Meal } from '@/hooks/useMeals'
import { useCart } from '@/context/CartContext'
import { isBbqBainMarieEligibleMeal, isDipTrayComboMeal, dipTrayComboSizeLabel, shouldChargeBainMarieServiceFee } from '@/lib/dipTrayCombo'
import { DESSERTS_CUPS_CATEGORY, getMealMinimumQuantity } from '@/lib/categoryMinimums'
import { FOOD_WARMER_OPTION_DESCRIPTION, FOOD_WARMER_OPTION_LABEL } from '@/lib/foodWarmerCopy'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { FadeUp } from './animations/FadeUp'

interface MealCardProps {
  meal: Meal
  index?: number
}

export function MealCard({ meal, index = 0 }: MealCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const [selectedSize, setSelectedSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null>(null)

  const isSaladCup = meal.name.toLowerCase().includes('salad cup')
  const isDipTrayCombo = isDipTrayComboMeal(meal)
  const isBbqBainMarieEligible = isBbqBainMarieEligibleMeal(meal)
  const isCheesecakeImage = meal.name.toLowerCase().includes('cheesecake')

  /** Mujadara is not offered in the food warmer tray size (even if legacy DB rows still have a price). */
  const isMujadara = meal.name === 'Lentils with Rice (Mujadara)'

  // Determine if meal has sizes
  const hasSizes = meal.pricingType === 'SIZED' && (
    meal.priceSmall !== null || 
    meal.priceMedium !== null || 
    meal.priceLarge !== null || 
    meal.priceBainMarie !== null
  )

  // Get available sizes
  const availableSizes: Array<{ value: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE'; label: string; price: number }> = []
  if (meal.priceSmall) {
    availableSizes.push({
      value: 'SMALL',
      label: isSaladCup ? 'Garden Salad' : isDipTrayCombo ? dipTrayComboSizeLabel('SMALL') : 'Small',
      price: meal.priceSmall,
    })
  }
  if (meal.priceMedium) {
    availableSizes.push({
      value: 'MEDIUM',
      label: isSaladCup ? 'Fattoush' : isDipTrayCombo ? dipTrayComboSizeLabel('MEDIUM') : 'Medium',
      price: meal.priceMedium,
    })
  }
  if (meal.priceLarge) {
    availableSizes.push({
      value: 'LARGE',
      label: isSaladCup ? 'Tabouli' : isDipTrayCombo ? dipTrayComboSizeLabel('LARGE') : 'Large',
      price: meal.priceLarge,
    })
  }
  if (meal.priceBainMarie && !isMujadara) {
    availableSizes.push({
      value: 'BAIN_MARIE',
      label: isDipTrayCombo ? dipTrayComboSizeLabel('BAIN_MARIE') : FOOD_WARMER_OPTION_LABEL,
      price: meal.priceBainMarie,
    })
  }

  useEffect(() => {
    if (!isMujadara || selectedSize !== 'BAIN_MARIE') return
    if (meal.priceSmall != null) setSelectedSize('SMALL')
    else if (meal.priceMedium != null) setSelectedSize('MEDIUM')
    else if (meal.priceLarge != null) setSelectedSize('LARGE')
  }, [isMujadara, meal.priceLarge, meal.priceMedium, meal.priceSmall, selectedSize])

  // Set default size for sized items
  if (hasSizes && !selectedSize && availableSizes.length > 0) {
    setSelectedSize(availableSizes[0].value)
  }

  const minQty = useMemo(() => getMealMinimumQuantity(meal), [meal])

  const existingQty = useMemo(() => {
    const match = items.find((item) => {
      if (item.mealId !== meal.id) return false
      if (meal.pricingType === 'SIZED' || isBbqBainMarieEligible) return (item.size ?? null) === (selectedSize ?? null)
      return true
    })
    return match?.quantity ?? 0
  }, [items, meal.id, meal.pricingType, selectedSize, isBbqBainMarieEligible])

  // Get display price
  const getDisplayPrice = () => {
    if (hasSizes && selectedSize) {
      const sizeOption = availableSizes.find(s => s.value === selectedSize)
      if (sizeOption) {
        const bainMarieFee = shouldChargeBainMarieServiceFee(meal, selectedSize) ? 55 : 0
        return sizeOption.price + bainMarieFee
      }
    }
    return meal.price
  }

  // Get price label
  const getPriceLabel = () => {
    if (meal.pricingType === 'PER_DOZEN') {
      return 'per dozen'
    } else if (meal.pricingType === 'PER_PERSON') {
      return 'per person'
    } else if (meal.pricingType === 'PER_SKEWER') {
      return 'per skewer'
    } else if (hasSizes) {
      const sizeOption = availableSizes.find(s => s.value === selectedSize)
      if (sizeOption) {
        if (selectedSize === 'BAIN_MARIE' && shouldChargeBainMarieServiceFee(meal, selectedSize)) {
          return FOOD_WARMER_OPTION_LABEL
        }
        return sizeOption.label
      }
    }
    return ''
  }

  const warmerSelected = selectedSize === 'BAIN_MARIE'
  const warmerFee = warmerSelected ? 55 : 0
  const basePrice = hasSizes && selectedSize
    ? (availableSizes.find((s) => s.value === selectedSize)?.price ?? meal.price)
    : meal.price
  const subtotalWithWarmer = basePrice + warmerFee

  const handleIncrement = () => {
    if (hasSizes && !selectedSize) return
    // If this item isn't in cart yet, start at minimum quantity (e.g. 12 pieces for finger food per item)
    if (existingQty === 0 && minQty > 1) {
      addItem(meal, minQty, selectedSize || null)
      return
    }
    addItem(meal, 1, selectedSize || null)
  }

  const handleDecrement = () => {
    if (hasSizes && !selectedSize) return
    if (existingQty <= 0) return

    // For minimum-quantity items, let user remove the line at the minimum
    if (minQty > 1 && existingQty <= minQty) {
      removeItem(meal.id, selectedSize || null)
      return
    }

    updateQuantity(meal.id, existingQty - 1, selectedSize || null)
  }

  if (!meal.isAvailable) {
    return (
      <FadeUp delay={index * 0.1} className="h-full">
        <div className="bg-white rounded-lg overflow-hidden shadow-md opacity-60 border-2 border-transparent h-full flex flex-col">
          <div className="relative h-48 sm:h-56 flex-shrink-0 overflow-hidden bg-gray-100">
            {meal.imageUrl ? (
              <Image
                src={meal.imageUrl}
                alt={meal.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized={isCheesecakeImage}
                className={isCheesecakeImage ? 'object-contain bg-white' : 'object-cover'}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#D4AF37]/20 to-[#0F3D3E]/20 flex items-center justify-center">
                <span className="text-[#0F3D3E]/40 text-4xl">🍽️</span>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col flex-1 min-h-0">
            <h3 className="font-semibold text-[#0F3D3E] mb-2 line-clamp-2 min-h-[2.75rem] leading-snug">
              {meal.name}
            </h3>
            <div className="text-sm text-gray-500 mb-2 min-h-[2.5rem]">
              {meal.description ? (
                <p className="line-clamp-2">{meal.description}</p>
              ) : (
                <span className="block opacity-0 select-none pointer-events-none" aria-hidden>
                  &nbsp;
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-auto">Unavailable</p>
          </div>
        </div>
      </FadeUp>
    )
  }

  return (
    <FadeUp delay={index * 0.1} className="h-full">
      <div className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-[#D4AF37] h-full flex flex-col">
        <div className="relative h-48 sm:h-56 flex-shrink-0 overflow-hidden bg-gray-100">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized={isCheesecakeImage}
              className={
                isCheesecakeImage
                  ? 'object-contain bg-white transition-transform duration-300'
                  : 'object-cover group-hover:scale-110 transition-transform duration-300'
              }
              priority={index < 4}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#D4AF37]/20 to-[#0F3D3E]/20 flex items-center justify-center">
              <span className="text-[#0F3D3E]/40 text-4xl">🍽️</span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1 min-h-0">
          <h3 className="font-semibold text-[#0F3D3E] mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2 min-h-[2.75rem] leading-snug">
            {meal.name}
          </h3>
          <div className="text-sm text-gray-600 mb-2 min-h-[2.5rem]">
            {meal.description ? (
              <p className="line-clamp-2">{meal.description}</p>
            ) : (
              <span className="block opacity-0 select-none pointer-events-none" aria-hidden>
                &nbsp;
              </span>
            )}
          </div>
          
          {/* Size selector for sized items */}
          {hasSizes && (
            <div className="mb-3 flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isDipTrayCombo ? 'Serving:' : 'Size:'}
              </label>
              <select
                value={selectedSize || ''}
                onChange={(e) => setSelectedSize(e.target.value as 'SMALL' | 'MEDIUM' | 'LARGE' | 'BAIN_MARIE' | null)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              >
                {availableSizes.map((size) => {
                  const fee = shouldChargeBainMarieServiceFee(meal, size.value) ? 55 : 0
                  const lineTotal = size.price + fee
                  return (
                  <option key={size.value} value={size.value}>
                    {size.label} — ${lineTotal.toFixed(2)}
                  </option>
                  )
                })}
              </select>
              {meal.priceBainMarie != null && !isMujadara && !isDipTrayCombo && (
                <p className="text-[11px] text-[#0F3D3E]/75 mt-1.5 leading-relaxed">{FOOD_WARMER_OPTION_DESCRIPTION}</p>
              )}
            </div>
          )}

          {/* Optional food warmer for eligible BBQ tray items */}
          {!hasSizes && isBbqBainMarieEligible && (
            <div className="mb-3 flex-shrink-0 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-2">
              <label className="flex items-start justify-between gap-2 text-xs text-[#0F3D3E] cursor-pointer">
                <span className="font-medium leading-snug pr-2">{FOOD_WARMER_OPTION_LABEL}</span>
                <input
                  type="checkbox"
                  checked={warmerSelected}
                  onChange={(e) => setSelectedSize(e.target.checked ? 'BAIN_MARIE' : null)}
                  className="h-4 w-4 mt-0.5 accent-[#D4AF37] shrink-0"
                  aria-describedby={`warmer-desc-${meal.id}`}
                />
              </label>
              <p id={`warmer-desc-${meal.id}`} className="mt-2 text-[11px] text-[#0F3D3E]/80 leading-relaxed">
                {FOOD_WARMER_OPTION_DESCRIPTION}
              </p>
            </div>
          )}

          {/* Minimum quantity notice — reserve one line when only some items need it */}
          <div className="min-h-[1.25rem] mb-2 flex-shrink-0">
            {minQty > 1 && (
              <p className="text-xs text-amber-600">
                {meal.category === DESSERTS_CUPS_CATEGORY ? (
                  <>Minimum order quantity for this item is 12.</>
                ) : (
                  <>
                    Min: {minQty} {meal.pricingType === 'PER_PERSON' ? 'people' : 'pieces'}
                  </>
                )}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-[#D4AF37] font-bold text-lg">
                {meal.pricingType === 'PER_PERSON' 
                  ? `$${meal.price.toFixed(2)} per person`
                  : meal.pricingType === 'SIZED' && meal.priceSmall
                  ? `From $${meal.priceSmall.toFixed(2)}`
                  : meal.pricingType === 'PER_DOZEN'
                  ? `$${meal.price.toFixed(2)} per dozen`
                  : meal.pricingType === 'PER_SKEWER'
                  ? `$${meal.price.toFixed(2)} per skewer`
                  : `$${getDisplayPrice().toFixed(2)}`
                }
              </p>
            </div>
            {!hasSizes && isBbqBainMarieEligible && (
              <div className="text-xs text-[#0F3D3E]/80 -mt-2">
                Base: ${basePrice.toFixed(2)}{meal.pricingType === 'PER_DOZEN' ? ' / dozen' : ' / skewer'} | Food warmer: {warmerSelected ? '+$55.00' : '$0.00'} | Subtotal: ${subtotalWithWarmer.toFixed(2)}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleDecrement}
                disabled={existingQty === 0 || (hasSizes && !selectedSize)}
                className="w-10 h-10 rounded-lg border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-[#D4AF37] flex items-center justify-center font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <div className="text-sm font-semibold text-[#0F3D3E]">
                  Qty: {existingQty}
                </div>
                {minQty > 1 && existingQty > 0 && existingQty < minQty && (
                  <div className="text-xs text-amber-600">
                    {meal.category === DESSERTS_CUPS_CATEGORY
                      ? 'Minimum order quantity for this item is 12.'
                      : `Min ${minQty}`}
                  </div>
                )}
              </div>
              <button
                onClick={handleIncrement}
                disabled={hasSizes && !selectedSize}
                className="w-10 h-10 rounded-lg border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-[#D4AF37] flex items-center justify-center font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </FadeUp>
  )
}

