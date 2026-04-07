'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PageContainer from '@/components/PageContainer'
import { PageBackground } from '@/components/PageBackground'
import { PageHero } from '@/components/PageHero'
import { FadeUp } from '@/components/animations/FadeUp'
import { useCart } from '@/context/CartContext'
import {
  buildQuoteRequestContextFromCart,
  clearQuoteRequestContextFromSession,
  mapQuoteLineItemsToApiCartItems,
  QUOTE_REQUEST_CONTEXT_KEY,
  type QuoteRequestContextPayload,
} from '@/lib/quoteRequestContext'

function RequestQuotePageContent() {
  const MAX_QUOTE_GUESTS = 100
  const MAX_QUOTE_GUESTS_MESSAGE =
    'Maximum 100 guests allowed for online booking. Please contact us for larger events.'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, totalPrice, clearCart } = useCart()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    estimatedGuests: '',
    preferredDate: '',
    postcode: '',
    suburb: '',
    budgetRange: '',
    message: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [checkoutContext, setCheckoutContext] = useState<QuoteRequestContextPayload | null>(null)

  /**
   * Live cart is the only source of truth for line items. Session is used only to merge
   * checkout-only fields (delivery fee, dates) when the cart still has items from checkout.
   * If the cart is empty, we clear any stale quote snapshot so old items never appear.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const readSession = (): QuoteRequestContextPayload | null => {
      try {
        const raw = sessionStorage.getItem(QUOTE_REQUEST_CONTEXT_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as QuoteRequestContextPayload
        if (Array.isArray(parsed?.items) && parsed.items.length > 0) return parsed
      } catch {
        // ignore malformed session data
      }
      return null
    }

    if (items.length > 0) {
      const session = readSession()
      const fromCheckout = session?.source === 'checkout'
      setCheckoutContext(
        buildQuoteRequestContextFromCart(items, {
          source: fromCheckout ? 'checkout' : 'cart',
          subtotal: totalPrice,
          deliveryFee: fromCheckout ? Number(session?.deliveryFee) || 0 : 0,
          deliveryDate: fromCheckout ? session?.deliveryDate : undefined,
          deliveryType: fromCheckout ? session?.deliveryType : undefined,
        })
      )
      return
    }

    clearQuoteRequestContextFromSession()
    setCheckoutContext(null)
  }, [items, totalPrice])

  useEffect(() => {
    if (searchParams?.get('source') !== 'checkout') return
    setFormData((prev) => ({
      ...prev,
      eventType: prev.eventType || 'Catering Event',
      budgetRange: prev.budgetRange || 'Over $10,000',
      message: prev.message || 'Quote requested from checkout for order over $1000.',
    }))
  }, [searchParams])

  const hasCartLines = useMemo(
    () => Boolean(checkoutContext?.items?.length),
    [checkoutContext]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const parsedGuests = formData.estimatedGuests ? parseInt(formData.estimatedGuests, 10) : null
      if (parsedGuests != null && Number.isFinite(parsedGuests) && parsedGuests > MAX_QUOTE_GUESTS) {
        throw new Error(MAX_QUOTE_GUESTS_MESSAGE)
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          eventType: formData.eventType,
          estimatedGuests: parsedGuests,
          preferredDate: formData.preferredDate || null,
          postcode: formData.postcode.trim(),
          suburb: formData.suburb.trim(),
          budgetRange: formData.budgetRange || null,
          message: formData.message.trim() || null,
          cartItems: mapQuoteLineItemsToApiCartItems(checkoutContext?.items ?? []),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit quote request')
      }

      setIsSuccess(true)
      clearCart()
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        eventType: '',
        estimatedGuests: '',
        preferredDate: '',
        postcode: '',
        suburb: '',
        budgetRange: '',
        message: '',
      })

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <PageBackground>
        <PageHero 
          title="Quote Request Submitted!" 
          subtitle="Thank you for your interest" 
        />
        <main className="min-h-screen py-12">
          <PageContainer>
            <div className="max-w-2xl mx-auto">
              <FadeUp>
                <div className="bg-white border-2 border-green-200 rounded-lg shadow-xl p-8 md:p-12 text-center">
                  <svg
                    className="w-16 h-16 text-green-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-[#0F3D3E]/80 mb-6 text-lg">
                    We'll contact you shortly to discuss your event requirements.
                  </p>
                  <p className="text-sm text-[#0F3D3E]/60">
                    Redirecting to home page...
                  </p>
                </div>
              </FadeUp>
            </div>
          </PageContainer>
        </main>
      </PageBackground>
    )
  }

  return (
    <PageBackground>
      <PageHero 
        title="Request a Quote" 
        subtitle="Tell us about your event — you can request a quote with or without selecting items. We’ll respond with pricing and availability." 
      />
      <main className="min-h-screen py-12">
        <PageContainer>
          <div className="max-w-2xl mx-auto">

            <FadeUp delay={0.2}>
              <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 md:p-12">
            {!hasCartLines && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-900 mb-1">You can request a quote with or without selecting items.</p>
                <p className="text-sm text-red-800">
                  If you don’t have items selected yet, submit your event details below and we’ll follow up for specifics.
                </p>
              </div>
            )}
            {checkoutContext && checkoutContext.items.length > 0 && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900 mb-2">
                  {checkoutContext.source === 'checkout'
                    ? 'Checkout quote request'
                    : 'Cart items for this quote'}
                </p>
                <p className="text-sm text-amber-800">
                  Subtotal: <strong>${Number(checkoutContext.subtotal).toFixed(2)}</strong>
                  {Number(checkoutContext.deliveryFee) > 0 && (
                    <>
                      {' '}
                      · Delivery: <strong>${Number(checkoutContext.deliveryFee).toFixed(2)}</strong>
                    </>
                  )}{' '}
                  · Total: <strong>${Number(checkoutContext.total).toFixed(2)}</strong>
                </p>
                <div className="mt-3 text-sm text-amber-900">
                  <p className="font-medium mb-1">Line items</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {checkoutContext.items.map((item, idx) => (
                      <li key={`${item.mealId}-${item.size ?? 'none'}-${idx}`}>
                        {item.name} ×{item.quantity}
                        {item.sizeDisplay || item.size ? ` (${item.sizeDisplay ?? item.size})` : ''} —{' '}
                        ${Number(item.lineTotal).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                  Event Type
                </label>
                <select
                  id="eventType"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                >
                  <option value="">Select event type</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Private Party">Private Party</option>
                  <option value="Office Lunch">Office Lunch</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="estimatedGuests" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                    Estimated Number of Guests
                  </label>
                  <input
                    type="number"
                    id="estimatedGuests"
                    min="1"
                    max={MAX_QUOTE_GUESTS}
                    value={formData.estimatedGuests}
                    onChange={(e) => {
                      const next = e.target.value
                      if (next === '') {
                        setFormData({ ...formData, estimatedGuests: '' })
                        if (error === MAX_QUOTE_GUESTS_MESSAGE) setError('')
                        return
                      }
                      const n = Number(next)
                      if (!Number.isFinite(n)) return
                      if (n > MAX_QUOTE_GUESTS) {
                        setFormData({ ...formData, estimatedGuests: String(MAX_QUOTE_GUESTS) })
                        setError(MAX_QUOTE_GUESTS_MESSAGE)
                        return
                      }
                      setFormData({ ...formData, estimatedGuests: next })
                      if (error === MAX_QUOTE_GUESTS_MESSAGE) setError('')
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                  />
                  <p className="mt-2 text-xs text-[#0F3D3E]/70">
                    For events over 100 guests, please contact us directly.
                  </p>
                </div>

                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    id="postcode"
                    required
                    value={formData.postcode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postcode: e.target.value.replace(/\D/g, '').slice(0, 4),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="suburb" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                    Suburb *
                  </label>
                  <input
                    type="text"
                    id="suburb"
                    required
                    value={formData.suburb}
                    onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="budgetRange" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                  Budget Range
                </label>
                <select
                  id="budgetRange"
                  value={formData.budgetRange}
                  onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                >
                  <option value="">Select budget range</option>
                  <option value="Under $1,000">Under $1,000</option>
                  <option value="$1,000 - $2,500">$1,000 - $2,500</option>
                  <option value="$2,500 - $5,000">$2,500 - $5,000</option>
                  <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                  <option value="Over $10,000">Over $10,000</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#0F3D3E] mb-2">
                  Additional Details / Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us more about your event, dietary requirements, or any special requests..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#0F3D3E] text-white px-6 py-3 rounded-lg hover:bg-[#0F3D3E]/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg text-[#0F3D3E] hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
              </div>
            </FadeUp>
          </div>
        </PageContainer>
      </main>
    </PageBackground>
  )
}

export default function RequestQuotePage() {
  return (
    <Suspense fallback={(
      <PageBackground>
        <main className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quote form...</p>
          </div>
        </main>
      </PageBackground>
    )}>
      <RequestQuotePageContent />
    </Suspense>
  )
}
