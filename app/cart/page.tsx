'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, type CartItem } from '@/context/CartContext'
import Link from 'next/link'
import PageContainer from '@/components/PageContainer'
import { PageBackground } from '@/components/PageBackground'
import { PageHero } from '@/components/PageHero'
import { FadeUp } from '@/components/animations/FadeUp'
import { isBbqBainMarieEligibleMeal, isDipTrayComboMeal, shouldChargeBainMarieServiceFee } from '@/lib/dipTrayCombo'
import { getMealMinimumQuantity } from '@/lib/categoryMinimums'
import { cartLineSizeLabel, FOOD_WARMER_OPTION_DESCRIPTION } from '@/lib/foodWarmerCopy'
import { buildQuoteRequestContextFromCart, saveQuoteRequestContextToSession } from '@/lib/quoteRequestContext'

function cartLineSizeLabelFromItem(item: CartItem) {
  if (!item.size) return ''
  return cartLineSizeLabel(item.meal, item.size)
}

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart()

  const hasItems = items.length > 0
  const quoteOnlyThreshold = 1000
  const minimumCheckoutSubtotal = 100
  const gstIncluded = totalPrice / 11

  const invalidMinimums = useMemo(() => {
    return items
      .map((item) => {
        const minQty = getMealMinimumQuantity(item.meal)
        return {
          ...item,
          requiredMin: minQty,
          isInvalid: item.quantity > 0 && item.quantity < minQty,
        }
      })
      .filter((x) => x.isInvalid)
  }, [items])

  const meetsMinimumSubtotal = totalPrice >= minimumCheckoutSubtotal
  const requiresQuote = totalPrice >= quoteOnlyThreshold
  const depositQuoteEligible = totalPrice >= 400 && totalPrice < quoteOnlyThreshold
  const canProceedToCheckout = invalidMinimums.length === 0 && meetsMinimumSubtotal && !requiresQuote

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    router.push('/checkout')
  }

  const goToRequestQuote = () => {
    // Any cart total: snapshot lines for /request-quote and email to the business.
    const payload = buildQuoteRequestContextFromCart(items, {
      source: 'cart',
      subtotal: totalPrice,
      deliveryFee: 0,
    })
    saveQuoteRequestContextToSession(payload)
    router.push('/request-quote?source=cart')
  }

  return (
    <PageBackground>
      <PageHero title="Shopping Cart" />
      <main className="min-h-screen py-12">
        <PageContainer>

          {!hasItems ? (
            <FadeUp delay={0.2}>
              <div className="bg-white rounded-lg shadow-xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
                <p className="text-[#0F3D3E] text-lg mb-6">Your cart is empty</p>
                <Link
                  href="/menu"
                  className="inline-block bg-[#0F3D3E] text-white px-8 py-3 rounded-lg hover:bg-[#0F3D3E]/90 transition-all duration-200 hover:scale-105 font-semibold shadow-lg"
                >
                  Browse Menu
                </Link>
              </div>
            </FadeUp>
          ) : (
            <div className="space-y-6">
              {/* Meals Section */}
              {items.length > 0 && (
                <FadeUp delay={0.2}>
                  <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-[#0F3D3E] font-playfair">Meals</h2>
                <div className="space-y-4">
                  {items.map((item, itemIndex) => (
                    <div
                      key={`${item.mealId}:${item.size ?? 'NONE'}:${item.bainMarieFee ?? 0}:${itemIndex}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 last:border-0 gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg sm:text-xl text-[#0F3D3E]">
                          {item.meal.name}
                        </h3>
                        <p className="text-[#0F3D3E]/70 text-sm sm:text-base">
                          {item.meal.description || 'No description'}
                        </p>
                        {item.size && (
                          <div className="text-[#0F3D3E]/60 text-sm mt-1 space-y-1">
                            <p>
                              {isDipTrayComboMeal(item.meal) ? 'Serving' : 'Size'}:{' '}
                              {cartLineSizeLabelFromItem(item)}
                            </p>
                            {shouldChargeBainMarieServiceFee(item.meal, item.size) && (
                              <p className="text-[11px] text-[#0F3D3E]/70 leading-snug">{FOOD_WARMER_OPTION_DESCRIPTION}</p>
                            )}
                          </div>
                        )}
                        {(() => {
                          let itemPrice = item.meal.price
                          if (item.meal.pricingType === 'SIZED' && item.size) {
                            if (item.size === 'SMALL' && item.meal.priceSmall) {
                              itemPrice = item.meal.priceSmall
                            } else if (item.size === 'MEDIUM' && item.meal.priceMedium) {
                              itemPrice = item.meal.priceMedium
                            } else if (item.size === 'LARGE' && item.meal.priceLarge) {
                              itemPrice = item.meal.priceLarge
                            } else if (item.size === 'BAIN_MARIE' && item.meal.priceBainMarie) {
                              itemPrice = item.meal.priceBainMarie
                            }
                          }
                          const bainMarieFee = item.bainMarieFee || 0
                          const finalPrice = itemPrice + bainMarieFee
                          return (
                        <div>
                        <p className="text-[#D4AF37] font-bold mt-1 text-base sm:text-lg">
                              ${finalPrice.toFixed(2)} {item.meal.pricingType === 'PER_DOZEN' ? 'per dozen' : item.meal.pricingType === 'PER_PERSON' ? 'per person' : item.meal.pricingType === 'PER_SKEWER' ? 'per skewer' : item.meal.name.toLowerCase().includes('salad cup') ? 'per cup' : 'each'}
                        </p>
                            {isBbqBainMarieEligibleMeal(item.meal) && (
                              <div className="text-xs text-[#0F3D3E]/80 mt-1 space-y-1">
                                <p>
                                  Base: ${itemPrice.toFixed(2)} | Food warmer add-on: ${bainMarieFee.toFixed(2)} | Line
                                  subtotal: ${(finalPrice * item.quantity).toFixed(2)}
                                </p>
                                {bainMarieFee > 0 && (
                                  <p className="text-[11px] leading-snug">{FOOD_WARMER_OPTION_DESCRIPTION}</p>
                                )}
                              </div>
                            )}
                        </div>
                          )
                        })()}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.mealId, item.quantity - 1, item.size ?? null)
                            }
                            className="w-10 h-10 rounded-lg border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-[#D4AF37] flex items-center justify-center font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-semibold text-[#0F3D3E]">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.mealId, item.quantity + 1, item.size ?? null)
                            }
                            className="w-10 h-10 rounded-lg border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-[#D4AF37] flex items-center justify-center font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                        {(() => {
                          let itemPrice = item.meal.price
                          if (item.meal.pricingType === 'SIZED' && item.size) {
                            if (item.size === 'SMALL' && item.meal.priceSmall) {
                              itemPrice = item.meal.priceSmall
                            } else if (item.size === 'MEDIUM' && item.meal.priceMedium) {
                              itemPrice = item.meal.priceMedium
                            } else if (item.size === 'LARGE' && item.meal.priceLarge) {
                              itemPrice = item.meal.priceLarge
                            } else if (item.size === 'BAIN_MARIE' && item.meal.priceBainMarie) {
                              itemPrice = item.meal.priceBainMarie
                            }
                          }
                          const bainMarieFee = item.bainMarieFee || 0
                          const finalPrice = itemPrice + bainMarieFee
                          return (
                        <span className="font-bold w-24 text-right text-base sm:text-lg text-[#0F3D3E]">
                              ${(finalPrice * item.quantity).toFixed(2)}
                        </span>
                          )
                        })()}
                        <button
                          onClick={() => removeItem(item.mealId, item.size ?? null)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm sm:text-base transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                    {invalidMinimums.length > 0 && (
                      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="text-amber-800 font-medium">
                          Some items don’t meet the minimum quantity yet.
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-amber-800">
                          {invalidMinimums.map((x) => (
                            <li key={`${x.mealId}:${x.size ?? 'NONE'}:${x.quantity}`}>
                              {x.meal.name}: Minimum order quantity for this item is {x.requiredMin}.
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!meetsMinimumSubtotal && (
                      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-red-800 font-medium">
                          Minimum order is ${minimumCheckoutSubtotal.toFixed(2)}.
                        </p>
                        <p className="text-sm text-red-800/90 mt-1">
                          Add ${(minimumCheckoutSubtotal - totalPrice).toFixed(2)} more to proceed to checkout, or{' '}
                          <button
                            type="button"
                            onClick={goToRequestQuote}
                            className="font-semibold text-red-900 underline underline-offset-2 hover:no-underline"
                          >
                            request a quote
                          </button>{' '}
                          with your current selection.
                        </p>
                      </div>
                    )}
                    {requiresQuote && (
                      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="text-amber-800 font-medium">
                          For large events, we provide tailored menus and pricing. Request a custom quote to get the best value.
                        </p>
                        <p className="text-sm text-amber-800/90 mt-1">
                          Continue to Request Quote instead of direct checkout.
                        </p>
                      </div>
                    )}
                    <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-semibold text-lg text-[#0F3D3E]">Subtotal (Meals):</span>
                      <span className="font-bold text-xl text-[#D4AF37]">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between items-center text-sm text-[#0F3D3E]/80">
                      <span>GST (included):</span>
                      <span>${gstIncluded.toFixed(2)}</span>
                    </div>
                  </div>
                </FadeUp>
              )}

              {/* Event Order Notice */}
              {totalPrice >= 400 && (
                <FadeUp delay={0.3}>
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-blue-900 font-medium">
                          This order qualifies as Event Catering. Event orders require at least 7 days notice.
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              )}

              {/* Large Order Quote Request */}
              {totalPrice > quoteOnlyThreshold && (
                <FadeUp delay={0.3}>
                  <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border-l-4 border-[#D4AF37] rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#0F3D3E] mb-2">Large order support</h3>
                        <p className="text-[#0F3D3E]/80 mb-4">For large events, we provide tailored menus and pricing. Request a custom quote to get the best value.</p>
                        <button
                          type="button"
                          onClick={goToRequestQuote}
                          className="inline-block bg-[#D4AF37] text-white px-6 py-2 rounded-lg hover:bg-[#D4AF37]/90 transition-colors font-semibold"
                        >
                          Request a Quote
                        </button>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              )}

              {/* Smaller orders: quote available at any total */}
              {totalPrice < 400 && !requiresQuote && (
                <FadeUp delay={0.32}>
                  <div className="bg-gradient-to-r from-[#0F3D3E]/5 to-[#D4AF37]/10 border-l-4 border-[#0F3D3E] rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-[#0F3D3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#0F3D3E] mb-2">Prefer a written quote?</h3>
                        <p className="text-[#0F3D3E]/80 mb-4">
                          You can request a quote at any cart total. We&apos;ll email you with your item list and next steps.
                        </p>
                        <button
                          type="button"
                          onClick={goToRequestQuote}
                          className="inline-block bg-[#0F3D3E] text-white px-6 py-2 rounded-lg hover:bg-[#0F3D3E]/90 transition-colors font-semibold"
                        >
                          Request a quote
                        </button>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              )}

              {/* Deposit bracket quote request ($400–$1000) */}
              {depositQuoteEligible && !requiresQuote && (
                <FadeUp delay={0.35}>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-50/40 border-l-4 border-blue-500 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#0F3D3E] mb-2">Mid-size orders ($401–$999)</h3>
                        <p className="text-[#0F3D3E]/80 mb-4">
                          Checkout online: bank transfer takes a 30% deposit (70% due 5 days before your event); card pays the
                          full amount immediately. Or request a quote for tailored pricing.
                        </p>
                        <button
                          type="button"
                          onClick={goToRequestQuote}
                          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          Request a quote
                        </button>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              )}

              {/* Summary */}
              <FadeUp delay={0.4}>
                <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
                  <div className="space-y-4 mb-6">
                    {items.length > 0 && (
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold text-[#0F3D3E]">Subtotal:</span>
                        <span className="font-semibold text-[#0F3D3E]">
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl pt-4 border-t-2 border-[#D4AF37]">
                      <span className="font-bold text-[#0F3D3E]">Total:</span>
                      <span className="font-bold text-2xl text-[#D4AF37]">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={clearCart}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-[#0F3D3E] hover:bg-gray-50 font-medium transition-colors"
                      >
                        Clear Cart
                      </button>
                      {requiresQuote ? (
                        <button
                          type="button"
                          onClick={goToRequestQuote}
                          className="flex-1 px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#D4AF37]/90 font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                          Request Quote
                        </button>
                      ) : (
                        <button
                          onClick={handleProceedToCheckout}
                          disabled={items.length === 0 || !canProceedToCheckout}
                          className="flex-1 px-6 py-3 bg-[#0F3D3E] text-white rounded-lg hover:bg-[#0F3D3E]/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                          Proceed to Checkout
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </FadeUp>
            </div>
          )}

        </PageContainer>
      </main>
    </PageBackground>
  )
}

