'use client'

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import type { Meal } from '@/hooks/useMeals'
import { useCreateOrder } from '@/hooks/useOrders'
import { StripeProvider } from '@/components/StripeProvider'
import { StripeCardElement } from '@/components/StripeCardElement'
import { PageBackground } from '@/components/PageBackground'
import { buildQuoteRequestContextFromCart, saveQuoteRequestContextToSession } from '@/lib/quoteRequestContext'
import { shouldChargeBainMarieServiceFee } from '@/lib/dipTrayCombo'
import { getMealMinimumQuantity } from '@/lib/categoryMinimums'
import {
  cartLineSizeLabel,
  FOOD_WARMER_OPTION_DESCRIPTION,
  formatOrderItemDisplayName,
} from '@/lib/foodWarmerCopy'

const STRIPE_FEE_PERCENT = 0.035

/** React list key: same meal can appear on multiple lines (size / food warmer variants). */
function cartLineKey(
  item: { mealId: string; size?: string | null; bainMarieFee?: number },
  index: number
) {
  return `${item.mealId}:${item.size ?? 'NONE'}:${item.bainMarieFee ?? 0}:${index}`
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, totalPrice, clearCart } = useCart()
  const createOrder = useCreateOrder()
  const checkoutFormRef = useRef<HTMLFormElement | null>(null)
  const stripeAutoSubmitTriggeredRef = useRef(false)
  /** Prevents concurrent create-intent calls without re-subscribing the effect to isCreatingPaymentIntent (retry storm on 400). */
  const paymentIntentInFlightRef = useRef(false)
  /** After a failed create-intent, block repeats for the same cart/pricing fingerprint until inputs change. */
  const paymentIntentFailedFingerprintRef = useRef<string | null>(null)

  // Calculate totals (cart-only; prebookings are currently not active)
  const subtotal = totalPrice
  const minimumCheckoutSubtotal = 100
  const normalCheckoutMax = 400
  const directCheckoutMax = 1000

  // Prebooking placeholders (to keep checkout compiling even if prebooking UI remains in the file)
  const selectedPrebookings: any[] = []
  const prebookingsSubtotal = 0
  const eventsDeliveryFees = 0
  const calculatePrebookingTotal = (_specialRequests?: any) => 0
  const updatePrebooking = { mutateAsync: async (_args: any) => ({}) } as any

  // Order type: default from cart total (Standard below $400, Event $400–$1000).
  const [orderType, setOrderType] = useState<'STANDARD' | 'EVENT' | ''>(() => {
    if (totalPrice > directCheckoutMax) return ''
    return totalPrice >= normalCheckoutMax ? 'EVENT' : 'STANDARD'
  })
  const [isEventConfirmed, setIsEventConfirmed] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [minimumOrder, setMinimumOrder] = useState(0)
  const prevEventTierRef = useRef<boolean | null>(
    totalPrice > directCheckoutMax ? null : totalPrice >= normalCheckoutMax
  )

  // Keep catering type in sync when cart total changes (e.g. user edits cart elsewhere).
  useEffect(() => {
    if (subtotal > directCheckoutMax) return
    const eventTier = subtotal >= normalCheckoutMax
    if (prevEventTierRef.current !== eventTier) {
      prevEventTierRef.current = eventTier
      setIsEventConfirmed(false)
    }
    setOrderType(eventTier ? 'EVENT' : 'STANDARD')
  }, [subtotal, directCheckoutMax, normalCheckoutMax])

  const [formData, setFormData] = useState({
    deliveryType: 'delivery' as 'delivery' | 'pickup',
    streetAddress: '',
    unitNumber: '',
    suburb: '',
    state: 'NSW',
    postcode: '',
    deliveryDate: '',
    deliveryTime: '',
    phoneNumber: '',
    email: '',
    name: '',
    paymentMethod: 'stripe' as 'stripe' | 'bank_transfer',
    cardholderName: '',
  })
  const [allergyConsentAcknowledged, setAllergyConsentAcknowledged] = useState(false)
  const [allergyConsentError, setAllergyConsentError] = useState('')

  const total = subtotal + deliveryFee
  const [error, setError] = useState('')
  const [postcodeError, setPostcodeError] = useState('')
  const [isCheckingPostcode, setIsCheckingPostcode] = useState(false)
  const [isPostcodeValid, setIsPostcodeValid] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Delivery, 2: Payment, 3: Review
  const [bankTransferOrderId, setBankTransferOrderId] = useState<string | null>(null)
  const [bankTransferExpiresAt, setBankTransferExpiresAt] = useState<string | null>(null)
  const [bankTransferInvoice, setBankTransferInvoice] = useState<any | null>(null)
  /** Snapshot from API — cart is cleared after order, so never use live `total` / `depositAmount` on this screen. */
  const [bankTransferPaymentInfo, setBankTransferPaymentInfo] = useState<{
    totalAmount: number
    paymentAmount: number
    remainingAmount: number
    paymentDueAt: string | null
  } | null>(null)
  
  // Stripe payment states
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null)
  const [stripePaymentSucceeded, setStripePaymentSucceeded] = useState(false)
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false)

  useEffect(() => {
    // Reset one-time auto-submit flag whenever Stripe payment is not successful.
    if (!stripePaymentSucceeded) {
      stripeAutoSubmitTriggeredRef.current = false
    }
  }, [stripePaymentSucceeded])

  useEffect(() => {
    if (currentStep !== 2) {
      paymentIntentFailedFingerprintRef.current = null
    }
  }, [currentStep])

  /** Order total (inc. delivery) ≥ $1000 → quote only, no online payment. */
  const orderValueMode: 'normal' | 'review' | 'quote_only' =
    total >= directCheckoutMax
      ? 'quote_only'
      : subtotal < normalCheckoutMax
        ? 'normal'
        : 'review'
  const stripeFee =
    formData.paymentMethod === 'stripe'
      ? Math.round(total * STRIPE_FEE_PERCENT * 100) / 100
      : 0
  const finalTotal = Math.round((total + stripeFee) * 100) / 100
  const orderTotalForGst =
    formData.paymentMethod === 'stripe' ? finalTotal : total
  const gstIncluded =
    Math.round((orderTotalForGst / 11) * 100) / 100
  /** Bank transfer $401–$999: 30% now, 70% by 5 days before event. */
  const bankPartialDeposit =
    formData.paymentMethod === 'bank_transfer' && total >= 401 && total <= 999
  const bankDepositNow = bankPartialDeposit
    ? Math.round(total * 0.3 * 100) / 100
    : formData.paymentMethod === 'bank_transfer'
      ? total
      : 0
  const remainingAfterBankDeposit = bankPartialDeposit
    ? Math.round((total - bankDepositNow) * 100) / 100
    : 0
  /** Matches Payment Intent: full amount incl. card fee for Stripe; deposit or full bank amount for transfer. */
  const stripePayableNow =
    formData.paymentMethod === 'stripe' ? finalTotal : bankDepositNow

  useEffect(() => {
    if (formData.paymentMethod !== 'stripe' || stripePaymentSucceeded) return
    // Recreate payment intent whenever payable Stripe amount changes.
    setStripeClientSecret(null)
    setStripePaymentIntentId(null)
  }, [formData.paymentMethod, stripePayableNow, stripePaymentSucceeded])

  // Delivery date minimums: Standard = 48 hours, Event = 168 hours (no past dates).
  // Note: delivery date is a date-only input; backend treats it as 00:00 UTC. So the earliest selectable
  // date must have its UTC midnight >= (now + minLeadHours).
  const msPerHour = 1000 * 60 * 60
  const msPerDay = 1000 * 60 * 60 * 24
  const minLeadHours = orderType === 'EVENT' ? 168 : 48
  const thresholdMs = Date.now() + minLeadHours * msPerHour
  const thresholdUtc = new Date(thresholdMs)
  let minDeliveryUtcMs = Date.UTC(
    thresholdUtc.getUTCFullYear(),
    thresholdUtc.getUTCMonth(),
    thresholdUtc.getUTCDate()
  )
  if (minDeliveryUtcMs < thresholdMs) {
    minDeliveryUtcMs += msPerDay
  }
  const minDeliveryDateUtc = new Date(minDeliveryUtcMs)
  const minDeliveryDateStr = `${minDeliveryDateUtc.getUTCFullYear()}-${String(
    minDeliveryDateUtc.getUTCMonth() + 1
  ).padStart(2, '0')}-${String(minDeliveryDateUtc.getUTCDate()).padStart(2, '0')}`
  const startTodayUtc = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  )
  const minBankPartialUtcMs = startTodayUtc + 5 * msPerDay
  const minBankPartialDateUtc = new Date(minBankPartialUtcMs)
  const minBankPartialDateStr = `${minBankPartialDateUtc.getUTCFullYear()}-${String(
    minBankPartialDateUtc.getUTCMonth() + 1
  ).padStart(2, '0')}-${String(minBankPartialDateUtc.getUTCDate()).padStart(2, '0')}`
  /** Bank $401–$999: event must be late enough that the 70% due date (5 days before event) is not in the past. */
  const effectiveMinDeliveryDateStr =
    formData.paymentMethod === 'bank_transfer' && total >= 401 && total <= 999
      ? minDeliveryDateStr > minBankPartialDateStr
        ? minDeliveryDateStr
        : minBankPartialDateStr
      : minDeliveryDateStr
  const maxDeliveryDateUtc = new Date()
  maxDeliveryDateUtc.setUTCDate(maxDeliveryDateUtc.getUTCDate() + 365)
  const maxDeliveryDateStr = `${maxDeliveryDateUtc.getUTCFullYear()}-${String(
    maxDeliveryDateUtc.getUTCMonth() + 1
  ).padStart(2, '0')}-${String(maxDeliveryDateUtc.getUTCDate()).padStart(2, '0')}`
  const isValidDateInput = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return false
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    if (month < 1 || month > 12 || day < 1 || day > 31) return false

    // Strict calendar validity (prevents overflow dates like 2026-02-31).
    const parsedUtc = new Date(Date.UTC(year, month - 1, day))
    return (
      parsedUtc.getUTCFullYear() === year &&
      parsedUtc.getUTCMonth() + 1 === month &&
      parsedUtc.getUTCDate() === day
    )
  }

  // Define validatePostcode function with useCallback to prevent unnecessary re-renders
  const validatePostcode = useCallback(async (postcode: string, suburb: string): Promise<boolean> => {
    if (!postcode.trim()) {
      setIsPostcodeValid(null)
      setPostcodeError('')
      return false
    }

    setIsCheckingPostcode(true)
    setPostcodeError('')
    setError('')

    try {
      const response = await fetch('/api/delivery-zones/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postcode: postcode.trim(), suburb: suburb.trim() }),
      })

      const text = await response.text()
      let data: { valid?: boolean; message?: string; error?: string; deliveryFee?: number; minimumOrder?: number } = {}
      try {
        if (text) data = JSON.parse(text)
      } catch {
        setIsPostcodeValid(false)
        setPostcodeError(
          `Postcode check returned an invalid response (${response.status}). If this continues, try refreshing the page.`
        )
        return false
      }

      if (response.ok) {
        if (data.valid) {
          setIsPostcodeValid(true)
          setPostcodeError('')
          if (data.deliveryFee !== undefined) {
            setDeliveryFee(data.deliveryFee)
          }
          if (data.minimumOrder !== undefined) {
            setMinimumOrder(data.minimumOrder)
          }
          return true
        }
        setIsPostcodeValid(false)
        setPostcodeError(data.message || 'Sorry, we cannot deliver to this address (postcode).')
        return false
      }

      setIsPostcodeValid(false)
      setPostcodeError(
        data.message || data.error || `Postcode validation failed (${response.status}). Please try again.`
      )
      return false
    } catch (err) {
      setIsPostcodeValid(false)
      setPostcodeError('Network error while validating postcode. Check your connection and try again.')
      return false
    } finally {
      setIsCheckingPostcode(false)
    }
  }, [])

  const postcodeValidationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedulePostcodeValidation = useCallback(
    (postcode: string, suburb: string) => {
      if (postcodeValidationTimeoutRef.current) {
        clearTimeout(postcodeValidationTimeoutRef.current)
      }

      postcodeValidationTimeoutRef.current = setTimeout(() => {
        if (postcode.trim().length === 4 && suburb.trim().length > 0) {
          validatePostcode(postcode, suburb)
        }
      }, 250)
    },
    [validatePostcode]
  )


  // Define handlePostcodeChange and handlePostcodeBlur BEFORE any early returns
  const handlePostcodeChange = (value: string) => {
    // Only allow numeric input and limit to 4 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 4)

    if (isPostcodeValid === false || postcodeError) {
      setIsPostcodeValid(null)
      setPostcodeError('')
    }

    setFormData((prev) => {
      if (numericValue.length === 4) {
        // Use prev.suburb so validation runs with the latest suburb if user filled it before postcode
        schedulePostcodeValidation(numericValue, prev.suburb)
      }
      return { ...prev, postcode: numericValue }
    })
  }

  const handlePostcodeBlur = useCallback(() => {
    if (formData.postcode.trim() && formData.postcode.length === 4) {
      validatePostcode(formData.postcode, formData.suburb)
    } else if (formData.postcode.trim() && formData.postcode.length !== 4) {
      setPostcodeError('Postcode must be 4 digits')
      setIsPostcodeValid(false)
    }
  }, [formData.postcode, formData.suburb, validatePostcode])

  const goToQuoteRequest = () => {
    const payload = buildQuoteRequestContextFromCart(items, {
      source: 'checkout',
      subtotal,
      deliveryFee,
      deliveryDate: formData.deliveryDate,
      deliveryType: formData.deliveryType,
    })
    saveQuoteRequestContextToSession(payload)
    router.push('/request-quote?source=checkout&reason=over-1000')
  }

  const downloadInvoice = () => {
    if (!bankTransferOrderId || !bankTransferInvoice) return
    const rows = (bankTransferInvoice.items || [])
      .map((item: any) => `<tr><td>${item.name}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">$${Number(item.price).toFixed(2)}</td><td style="text-align:right">$${Number(item.lineTotal).toFixed(2)}</td></tr>`)
      .join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${bankTransferOrderId}</title></head><body style="font-family:Arial,sans-serif;padding:24px"><h1>Invoice</h1><p><strong>Order ID:</strong> ${bankTransferOrderId}</p><p><strong>Payment Method:</strong> Bank Transfer</p><table style="width:100%;border-collapse:collapse" border="1" cellpadding="8"><thead><tr><th align="left">Item</th><th>Qty</th><th align="right">Unit</th><th align="right">Line</th></tr></thead><tbody>${rows}</tbody></table><p><strong>Subtotal:</strong> $${Number(bankTransferInvoice.subtotal).toFixed(2)}</p><p><strong>Delivery Fee:</strong> $${Number(bankTransferInvoice.deliveryFee).toFixed(2)}</p><p><strong>GST (included):</strong> $${Number(bankTransferInvoice.gstIncluded).toFixed(2)}</p><h2>Total: $${Number(bankTransferInvoice.total).toFixed(2)}</h2></body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${bankTransferOrderId}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Important: do not early-return before hooks below (Rule of Hooks).

  const invalidMinimums = useMemo(
    () =>
      items
        .map((item) => {
          const minQty = getMealMinimumQuantity(item.meal)
          return {
            ...item,
            requiredMin: minQty,
            isInvalid: item.quantity > 0 && item.quantity < minQty,
          }
        })
        .filter((x) => x.isInvalid),
    [items]
  )


  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault?.()
    setError('')
    setAllergyConsentError('')

    if (orderValueMode === 'quote_only') {
      setError('Orders of $1000 or more require a quote request. Online payment is not available.')
      return
    }

    if (subtotal < minimumCheckoutSubtotal) {
      setError(`Minimum order is $${minimumCheckoutSubtotal.toFixed(2)}. Please add more items to your cart.`)
      return
    }

    if (invalidMinimums.length > 0) {
      const first = invalidMinimums[0]
      setError(`Minimum order quantity for this item is ${first.requiredMin}.`)
      return
    }

    if (!allergyConsentAcknowledged) {
      const consentError = 'You must accept the allergy disclaimer before proceeding'
      setAllergyConsentError(consentError)
      setError(consentError)
      return
    }
    
    // Validate required contact information for email confirmation
    if (!formData.email.trim()) {
      setError('Email is required to send order confirmation')
      return
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    // Step 2: Validate order type is selected
    if (!orderType) {
      setError('Please select an order type (Standard Catering or Event Catering)')
      return
    }

    // Enforce order type against subtotal before payment/order creation.
    if (orderType === 'EVENT' && subtotal < 400) {
      setError('Event catering orders must be at least $400. Please choose Standard Catering or add more items.')
      return
    }
    if (orderType === 'STANDARD' && subtotal >= 400) {
      setError('Orders above $400 must be placed as Event Catering.')
      return
    }

    // Step 3: Validate address information if delivery is selected
    if (formData.deliveryType === 'delivery') {
      // Validate all address fields
      if (!formData.streetAddress.trim()) {
        setError('Please enter a street address')
        return
      }
      if (!formData.suburb.trim()) {
        setError('Please enter a suburb')
        return
      }
      if (!formData.state.trim()) {
        setError('Please select a state')
        return
      }
      
      // Only accept NSW state
      if (formData.state.trim() !== 'NSW') {
        setError('We currently only deliver to New South Wales (NSW). Please select NSW as your state.')
        return
      }
      if (!formData.postcode.trim()) {
        setError('Please enter a postcode for delivery')
        return
      }

      // Validate postcode format and delivery availability via API
      if (isPostcodeValid === null || isPostcodeValid === false) {
        const isValid = await validatePostcode(formData.postcode, formData.suburb)
        if (!isValid) {
          if (postcodeError) {
            setError(postcodeError)
          } else {
            setError('Please enter a valid postcode for delivery')
          }
          return
        }
      }

      // Ensure postcode is actually valid before proceeding
      if (isPostcodeValid !== true) {
        if (postcodeError) {
          setError(postcodeError)
        } else {
          setError('We do not currently deliver to your area.')
        }
        return
      }
    }

    // Step 4: Validate delivery date
    if (!formData.deliveryDate) {
      setError('Please select a delivery date')
      return
    }
    if (!isValidDateInput(formData.deliveryDate)) {
      setError('Please enter a valid delivery date')
      return
    }
    if (formData.deliveryDate < effectiveMinDeliveryDateStr) {
      if (
        formData.paymentMethod === 'bank_transfer' &&
        total >= 401 &&
        total <= 999 &&
        formData.deliveryDate < minBankPartialDateStr
      ) {
        setError(
          'For bank transfer orders between $401 and $999, choose an event date at least 5 days from today so the remaining balance can be due 5 days before your event.'
        )
      } else {
        setError(
          orderType === 'EVENT'
            ? 'Please select an event delivery date at least 7 days from now.'
            : 'Please select a delivery date at least 48 hours from now.'
        )
      }
      return
    }
    if (formData.deliveryDate > maxDeliveryDateStr) {
      setError('Please select a delivery date within the next 12 months.')
      return
    }

    if (formData.paymentMethod === 'stripe') {
      // For Stripe payments, payment is already processed in the StripeCardElement
      if (!stripePaymentSucceeded || !stripePaymentIntentId) {
        setError('Please complete the Stripe payment first')
        return
      }
      
      // Verify payment intent status
      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ paymentIntentId: stripePaymentIntentId }),
        })

        if (!response.ok) {
          const error = await response.json()
          setError(error.error || 'Payment verification failed')
          return
        }

        const paymentData = await response.json()
        if (paymentData.status !== 'succeeded') {
          setStripePaymentSucceeded(false)
          setError('Payment was not successful. Please try again.')
          return
        }
      } catch (err: any) {
        setStripePaymentSucceeded(false)
        setError('Failed to verify payment. Please try again.')
        return
      }
    }

    setError('')
    setIsSubmitting(true)

    try {
      // Create order
      const orderData: any = {
        items: items.map((item) => ({
          mealId: item.mealId,
          quantity: item.quantity,
          size: item.size || null,
          bainMarieFee: item.bainMarieFee || 0,
        })),
        orderType,
        isEventConfirmed: orderType === 'EVENT' ? true : false,
        paymentMethod: formData.paymentMethod === 'bank_transfer' ? 'BANK_TRANSFER' : 'STRIPE',
        deliveryDate: formData.deliveryDate,
        deliveryType: formData.deliveryType.toUpperCase(),
        email: formData.email.trim(),
        name: formData.name.trim(),
        stripeFee: formData.paymentMethod === 'stripe' ? stripeFee : 0,
        totalAmount: formData.paymentMethod === 'stripe' ? finalTotal : total,
      }
      
      if (formData.deliveryType === 'delivery' && formData.postcode.trim()) {
        orderData.postcode = formData.postcode.trim()
      }

      if (formData.deliveryType === 'delivery' && formData.suburb.trim()) {
        orderData.suburb = formData.suburb.trim()
      }

      orderData.phoneNumber = formData.phoneNumber.trim()
      orderData.streetAddress = formData.streetAddress.trim()
      orderData.unitNumber = formData.unitNumber.trim()
      orderData.state = formData.state.trim()
      orderData.deliveryTime = formData.deliveryTime
      
      const order = await createOrder.mutateAsync(orderData)
      const orderId = order.id
      
      // Clear cart after successful order
      clearCart()

      if (formData.paymentMethod === 'bank_transfer') {
        setBankTransferOrderId(orderId)
        setBankTransferExpiresAt(order.expiresAt || null)
        setBankTransferPaymentInfo({
          totalAmount: Number(order.totalAmount ?? total),
          paymentAmount: Number(order.depositAmount ?? order.totalAmount ?? total),
          remainingAmount: Number(order.remainingAmount ?? 0),
          paymentDueAt: order.expiresAt ? String(order.expiresAt) : null,
        })
        setBankTransferInvoice({
          items: items.map((item) => {
            let itemPrice = item.meal.price
            if (item.meal.pricingType === 'SIZED' && item.size) {
              if (item.size === 'SMALL' && item.meal.priceSmall) itemPrice = item.meal.priceSmall
              else if (item.size === 'MEDIUM' && item.meal.priceMedium) itemPrice = item.meal.priceMedium
              else if (item.size === 'LARGE' && item.meal.priceLarge) itemPrice = item.meal.priceLarge
              else if (item.size === 'BAIN_MARIE' && item.meal.priceBainMarie) itemPrice = item.meal.priceBainMarie
            }
            const unitPrice = itemPrice + (item.bainMarieFee || 0)
            return {
              name: formatOrderItemDisplayName(item.meal as Meal, item.size),
              quantity: item.quantity,
              price: unitPrice,
              lineTotal: unitPrice * item.quantity,
            }
          }),
          subtotal,
          deliveryFee,
          total,
          gstIncluded,
        })
      }

      // Confirmation email is sent server-side from POST /api/orders after the order is saved.

      if (formData.paymentMethod !== 'bank_transfer') {
        // Redirect to success page after a brief delay to ensure component state is stable
        setTimeout(() => {
          router.push('/?success=true')
        }, 100)
      }
    } catch (err: any) {
      if (err?.message === 'QUOTE_REQUIRED') {
        setError('For large events, we provide tailored menus and pricing. Request a custom quote to get the best value.')
      } else {
        setError(err.message || 'Failed to complete checkout')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step validation
  const canProceedToStep2 = useMemo(() => {
    if (orderValueMode === 'quote_only') return false
    if (items.length > 0 && invalidMinimums.length > 0) return false
    // Require order type selection
    if (!orderType) return false
    // Keep order-type rules aligned with backend before user reaches payment step.
    if (orderType === 'EVENT' && subtotal < 400) return false
    if (orderType === 'STANDARD' && subtotal >= 400) return false

    // Always require contact information (email, name, phone)
    const hasContactInfo = formData.email.trim() !== '' && 
                          formData.name.trim() !== '' && 
                          formData.phoneNumber.trim() !== ''
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const hasValidEmail = emailRegex.test(formData.email.trim())
    
    if (!hasContactInfo || !hasValidEmail) {
      return false
    }
    
    // If only prebookings, need contact info AND address info
    if (items.length === 0 && selectedPrebookings.length > 0) {
      return formData.streetAddress.trim() !== '' && 
             formData.suburb.trim() !== '' &&
             formData.state.trim() === 'NSW' && // Only NSW accepted
             formData.postcode.trim() !== '' &&
             isPostcodeValid === true
    }
    // If meal items, require delivery info
    if (items.length > 0) {
      if (formData.deliveryType === 'delivery') {
        return formData.streetAddress.trim() !== '' && 
               formData.suburb.trim() !== '' &&
               formData.state.trim() === 'NSW' && // Only NSW accepted
               formData.postcode.trim() !== '' &&
               isPostcodeValid === true &&
               formData.deliveryDate !== '' &&
               formData.deliveryTime !== '' &&
               formData.phoneNumber.trim() !== '' &&
               formData.email.trim() !== '' &&
               formData.name.trim() !== ''
      } else {
        // For pickup, only need date, time, and contact info
        return formData.deliveryDate !== '' &&
               formData.deliveryTime !== '' &&
               formData.phoneNumber.trim() !== '' &&
               formData.email.trim() !== '' &&
               formData.name.trim() !== ''
      }
    }
    return false
  }, [items.length, invalidMinimums.length, formData, isPostcodeValid, orderType, orderValueMode, subtotal])

  const step2BlockingReason = useMemo(() => {
    if (orderValueMode === 'quote_only') return ''
    if (items.length > 0 && invalidMinimums.length > 0) {
      const first = invalidMinimums[0]
      return `Minimum order quantity for this item is ${first.requiredMin}.`
    }
    if (!orderType) return 'Select an order type first.'
    if (orderType === 'EVENT' && subtotal < 400) return 'Event Catering requires at least $400 subtotal.'
    if (orderType === 'STANDARD' && subtotal >= 400) return 'Orders above $400 must be Event Catering.'
    if (orderType === 'EVENT' && !isEventConfirmed) return 'Tick the Event Catering confirmation checkbox.'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) return 'Enter a valid email address.'
    if (!formData.name.trim()) return 'Enter your full name.'
    if (!formData.phoneNumber.trim()) return 'Enter your phone number.'

    if (items.length > 0) {
      if (formData.deliveryType === 'delivery') {
        if (!formData.streetAddress.trim()) return 'Enter street address.'
        if (!formData.suburb.trim()) return 'Enter suburb.'
        if (formData.state.trim() !== 'NSW') return 'State must be NSW.'
        if (!formData.postcode.trim()) return 'Enter postcode.'
        if (isPostcodeValid !== true) return 'Validate a deliverable postcode/suburb.'
      }
      if (!formData.deliveryDate) return 'Select delivery date.'
      if (!formData.deliveryTime) return 'Select delivery time.'
    }

    return ''
  }, [orderValueMode, orderType, subtotal, isEventConfirmed, formData, items.length, invalidMinimums, isPostcodeValid])

  const canProceedToStep3 = useMemo(() => {
    if (orderValueMode === 'quote_only') return false
    return true
  }, [orderValueMode])

  const steps = [
    { number: 1, title: 'Delivery', description: 'Delivery information' },
    { number: 2, title: 'Payment', description: 'Payment method' },
    { number: 3, title: 'Review', description: 'Review & confirm' },
  ]

  const handleNextStep = () => {
    if (currentStep === 1 && canProceedToStep2) {
      setCurrentStep(2)
    } else if (currentStep === 2 && canProceedToStep3) {
      setCurrentStep(3)
    }
  }

  // Don't auto-advance - user must fill contact info first
  // Removed auto-advance to ensure contact information is collected

  // Create Stripe payment intent when entering payment step and Stripe is selected
  useEffect(() => {
    const createPaymentIntent = async () => {
      const cartFingerprint = items
        .map((item) => `${item.mealId}:${item.quantity}:${item.size ?? ''}:${item.bainMarieFee ?? 0}`)
        .sort()
        .join('|')
      const pricingFingerprint = [
        formData.paymentMethod,
        formData.deliveryType,
        formData.postcode.trim(),
        formData.suburb.trim(),
        String(finalTotal),
        orderType ?? '',
        cartFingerprint,
      ].join('::')

      // Only create intent if:
      // 1. We're on step 2 (payment step)
      // 2. We don't already have a client secret
      // 3. There's an amount to charge
      // Note: do not list isCreatingPaymentIntent in deps — toggling it re-ran this effect and spammed POST on errors.
      if (
        currentStep === 2 &&
        formData.paymentMethod === 'stripe' &&
        orderValueMode !== 'quote_only' &&
        !stripeClientSecret &&
        !paymentIntentInFlightRef.current
      ) {
        if (total > 0 && orderType) {
          if (paymentIntentFailedFingerprintRef.current === pricingFingerprint) {
            return
          }
          paymentIntentInFlightRef.current = true
          setIsCreatingPaymentIntent(true)
          setError('') // Clear any previous errors

          try {
            const response = await fetch('/api/payments/create-intent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                items: items.map((item) => ({
                  mealId: item.mealId,
                  quantity: item.quantity,
                  size: item.size || null,
                })),
                deliveryType: formData.deliveryType,
                postcode: formData.postcode.trim() || undefined,
                suburb: formData.suburb.trim() || undefined,
                totalAmount: finalTotal,
                currency: 'aud',
                metadata: {
                  orderType: orderType.toLowerCase(),
                  bankDepositNow: bankDepositNow.toFixed(2),
                  remainingAfterBankDeposit: remainingAfterBankDeposit.toFixed(2),
                },
              }),
            })

            if (response.ok) {
              paymentIntentFailedFingerprintRef.current = null
              const data = await response.json()
              if (data.clientSecret) {
                setStripeClientSecret(data.clientSecret)
                setStripePaymentIntentId(data.paymentIntentId)
                setStripePaymentSucceeded(false)
              } else {
                setError('Failed to initialize payment. Please try again.')
                paymentIntentFailedFingerprintRef.current = pricingFingerprint
              }
            } else {
              const errorData = await response.json().catch(() => ({ error: 'Failed to initialize payment' }))
              setError(errorData.error || 'Failed to initialize payment')
              paymentIntentFailedFingerprintRef.current = pricingFingerprint
            }
          } catch (err: any) {
            console.error('Error creating payment intent:', err)
            setError(err.message || 'Failed to initialize payment. Please try again.')
            paymentIntentFailedFingerprintRef.current = pricingFingerprint
          } finally {
            paymentIntentInFlightRef.current = false
            setIsCreatingPaymentIntent(false)
          }
        }
      }
    }

    void createPaymentIntent()
  }, [
    currentStep,
    stripeClientSecret,
    total,
    orderType,
    items,
    formData.paymentMethod,
    formData.deliveryType,
    formData.postcode,
    formData.suburb,
    orderValueMode,
    bankDepositNow,
    remainingAfterBankDeposit,
    stripePayableNow,
    finalTotal,
    stripeFee,
  ])

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const stripePaymentFinalized = formData.paymentMethod !== 'stripe' || stripePaymentSucceeded
  const isStripeAwaitingAutoOrder =
    formData.paymentMethod === 'stripe' &&
    stripePaymentFinalized &&
    stripeAutoSubmitTriggeredRef.current
  const placeOrderBlockingReason = useMemo(() => {
    if (orderValueMode === 'quote_only') return 'Orders above $1000 require a quote request.'
    if (items.length > 0 && invalidMinimums.length > 0) {
      const first = invalidMinimums[0]
      return `Minimum order quantity for this item is ${first.requiredMin}.`
    }
    if (!allergyConsentAcknowledged) return 'Please acknowledge the allergy notice.'
    if (!orderType) return 'Please select order type.'
    if (orderType === 'EVENT' && subtotal < 400) return 'Event Catering requires at least $400 subtotal.'
    if (orderType === 'STANDARD' && subtotal >= 400) return 'Orders above $400 must be Event Catering.'
    if (!formData.email.trim()) return 'Email is required.'
    if (!formData.name.trim()) return 'Name is required.'
    if (!formData.phoneNumber.trim()) return 'Phone number is required.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) return 'Please enter a valid email address.'
    if (!formData.deliveryDate) return 'Please select delivery date.'
    if (!formData.deliveryTime) return 'Please select delivery time.'
    if (formData.deliveryType === 'delivery') {
      if (!formData.streetAddress.trim()) return 'Street address is required.'
      if (!formData.suburb.trim()) return 'Suburb is required.'
      if (formData.state.trim() !== 'NSW') return 'Delivery is only available in NSW.'
      if (!formData.postcode.trim()) return 'Postcode is required for delivery.'
      if (isPostcodeValid !== true) return 'Please validate suburb/postcode for delivery.'
    }
    return ''
  }, [
    orderValueMode,
    allergyConsentAcknowledged,
    orderType,
    subtotal,
    formData,
    isPostcodeValid,
    items.length,
    invalidMinimums,
  ])
  const canPlaceOrder =
    !isSubmitting &&
    placeOrderBlockingReason === ''

  return (
    <PageBackground>
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Checkout</h1>
        <p className="text-sm text-[#0F3D3E]/80 mb-6 sm:mb-8 max-w-2xl">
          No account required. Simply place your order.
        </p>

        {bankTransferOrderId ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-[#D4AF37]/30">
              <h1 className="text-3xl font-bold text-[#0F3D3E] mb-3">Order Placed - Pending Payment</h1>
              <p className="text-[#0F3D3E]/80 mb-6">
                Your order has been created successfully. Please complete payment via bank transfer.
              </p>
              <div className="space-y-2 text-sm mb-6">
                <p><span className="font-semibold">Order ID:</span> {bankTransferOrderId}</p>
                {bankTransferPaymentInfo && (
                  <>
                    <p><span className="font-semibold">Order total:</span> ${bankTransferPaymentInfo.totalAmount.toFixed(2)}</p>
                    <p><span className="font-semibold">Payment amount (due now):</span> ${bankTransferPaymentInfo.paymentAmount.toFixed(2)}</p>
                    {bankTransferPaymentInfo.remainingAmount > 0.01 && (
                      <p><span className="font-semibold">Remaining balance:</span> ${bankTransferPaymentInfo.remainingAmount.toFixed(2)}</p>
                    )}
                    {(bankTransferPaymentInfo.paymentDueAt || bankTransferExpiresAt) && (
                      <p><span className="font-semibold">Payment due by:</span> {new Date(bankTransferPaymentInfo.paymentDueAt || bankTransferExpiresAt || '').toLocaleString()}</p>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-6">
                {bankTransferPaymentInfo && bankTransferPaymentInfo.remainingAmount > 0.01
                  ? <>Please transfer at least the payment amount above to confirm your booking. Use your order ID <strong>{bankTransferOrderId}</strong> as reference.</>
                  : <>Please transfer the full order total to confirm your booking. Use your order ID <strong>{bankTransferOrderId}</strong> as reference.</>
                }
              </p>
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3 mb-6">
                Payment details have been sent to your email.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={downloadInvoice}
                  className="bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-colors"
                >
                  Download Invoice
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-[#0F3D3E] text-white px-6 py-3 rounded-lg hover:bg-[#0F3D3E]/90 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              Your cart is empty. <a href="/cart" className="underline">Go to cart</a> to select items.
            </div>
          </div>
        ) : (
          <>
            {orderValueMode === 'review' && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
                Orders between $401 and $999 (including delivery):{' '}
                <strong>Bank transfer</strong> — 30% deposit now, remaining 70% due 5 days before your event.{' '}
                <strong>Card (Stripe)</strong> — full amount is charged immediately (includes 3.5% processing fee).
              </div>
            )}
            {orderValueMode === 'quote_only' && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">
                  Orders over $1000 require a quote request. Please contact us — online payment is not available for this total.
                </p>
                <p className="text-sm text-amber-800 mt-1">Use Request Quote to send your cart and event details.</p>
                <button
                  type="button"
                  onClick={goToQuoteRequest}
                  className="mt-3 bg-[#D4AF37] text-white px-4 py-2 rounded-md hover:opacity-90"
                >
                  Request Quote
                </button>
              </div>
            )}

            {/* Progress Stepper */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= step.number
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {currentStep > step.number ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="font-semibold">{step.number}</span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${
                          currentStep >= step.number ? 'text-[#D4AF37]' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.number ? 'bg-[#D4AF37]' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Enhanced Order Summary */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Meals Section with Images */}
              {items.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Meals ({items.length})</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item, itemIndex) => (
                      <div key={cartLineKey(item, itemIndex)} className="flex items-center space-x-3">
                        {item.meal.imageUrl && (
                          <img 
                            src={item.meal.imageUrl} 
                            alt={item.meal.name}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.meal.name}</p>
                          {item.size && (
                            <div className="mt-0.5 space-y-0.5">
                              <p className="text-xs text-gray-500 truncate">
                                {cartLineSizeLabel(item.meal, item.size)}
                              </p>
                              {shouldChargeBainMarieServiceFee(item.meal, item.size) && (
                                <p className="text-[10px] text-gray-500 leading-snug">{FOOD_WARMER_OPTION_DESCRIPTION}</p>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-[#D4AF37] mt-1">
                            ${(item.meal.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Meals Subtotal:</span>
                      <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Type Display */}
              {orderType && (
                <div className="mb-4 pb-3 border-b">
                  <div className="text-sm">
                    <span className="text-gray-600">Order Type:</span>
                    <span className="font-semibold ml-2">{orderType === 'STANDARD' ? 'Standard Catering' : 'Event Catering'}</span>
                  </div>
                </div>
              )}

              {/* Subtotal */}
              <div className="mb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Fee */}
              {formData.deliveryType === 'delivery' && deliveryFee > 0 && (
                <div className="mb-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t-2 border-gray-200 pt-4 mt-4">
                {formData.paymentMethod === 'stripe' && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Card processing fee (3.5%):</span>
                    <span className="font-semibold">${stripeFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">GST (included):</span>
                  <span className="font-semibold">${gstIncluded.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-[#D4AF37]">
                    ${(formData.paymentMethod === 'stripe' ? finalTotal : total).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secure</span>
                </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verified</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <span>SSL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form - Step Based */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
              <form ref={checkoutFormRef} onSubmit={(e) => { void handleSubmit(e) }} className="space-y-6">
                
                {/* Step 1: Order Type & Delivery Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Order Type</h2>
                      <p className="text-gray-600 text-sm mb-4">Please select your order type</p>
                      
                      <div className="space-y-3">
                        <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="orderType"
                            value="STANDARD"
                            checked={orderType === 'STANDARD'}
                            onChange={(e) => setOrderType(e.target.value as 'STANDARD' | 'EVENT')}
                            className="mt-1 mr-4"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-lg">Standard Catering</div>
                            <div className="text-sm text-gray-600 mt-1">
                              <p>• Minimum 2 days (48 hours) notice required</p>
                              <p>• Minimum order: $100</p>
                              <p>• Maximum order: $399</p>
                            </div>
                          </div>
                        </label>
                        
                        <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="orderType"
                            value="EVENT"
                            checked={orderType === 'EVENT'}
                            onChange={(e) => {
                              setOrderType(e.target.value as 'STANDARD' | 'EVENT')
                              if (e.target.value === 'EVENT') {
                                setIsEventConfirmed(false) // Reset confirmation when switching to Event
                              }
                            }}
                            className="mt-1 mr-4"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-lg">Event Catering</div>
                            <div className="text-sm text-gray-600 mt-1">
                              <p>• Minimum 7 days notice required</p>
                              <p>• Minimum order: $400</p>
                            </div>
                            {subtotal >= 400 && orderType !== 'EVENT' && (
                              <p className="text-xs text-blue-600 mt-2 font-medium">
                                ⚠️ Your order is $400+. Please select Event Catering.
                              </p>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Event Confirmation Checkbox - Required for Event orders */}
                      {orderType === 'EVENT' && (
                        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEventConfirmed}
                              onChange={(e) => setIsEventConfirmed(e.target.checked)}
                              className="mt-1 mr-3"
                              required
                            />
                            <div className="flex-1">
                              <span className="font-semibold text-blue-900">
                                I confirm this is an Event Catering order
                              </span>
                              <p className="text-sm text-blue-700 mt-1">
                                Event orders require a minimum of 7 days notice. By checking this box, I confirm that my delivery date is at least 7 days from today and my order total is $400 or more.
                              </p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-2">Delivery Information</h2>
                      <p className="text-gray-600 text-sm">Please provide your delivery details</p>
                    </div>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                    {/* Delivery/Pickup Information - Only required for meal items */}
                    {items.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Delivery or Pickup</h3>
                    </div>
                  <div className="space-y-4">
                      {/* Delivery Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Choose Option *
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="deliveryType"
                              value="delivery"
                              checked={formData.deliveryType === 'delivery'}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  deliveryType: e.target.value as 'delivery' | 'pickup',
                                  postcode: '',
                                  state: 'NSW',
                                })
                                setIsPostcodeValid(null)
                                setPostcodeError('')
                              }}
                              className="mr-2"
                            />
                            Delivery
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="deliveryType"
                              value="pickup"
                              checked={formData.deliveryType === 'pickup'}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  deliveryType: e.target.value as 'delivery' | 'pickup',
                                })
                                setIsPostcodeValid(null)
                                setPostcodeError('')
                                // Pickup has no delivery fee — must reset or Stripe intent totals disagree with server.
                                setDeliveryFee(0)
                                setMinimumOrder(0)
                              }}
                              className="mr-2"
                            />
                            Pickup
                          </label>
                        </div>
                      </div>

                      {/* Address Fields - Required for delivery */}
                      {formData.deliveryType === 'delivery' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Delivery Address</h3>
                          
                          {/* Unit/Apartment Number (Optional) */}
                          <div>
                            <label
                              htmlFor="unitNumber"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Unit/Apartment Number
                            </label>
                            <input
                              type="text"
                              id="unitNumber"
                              value={formData.unitNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  unitNumber: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              placeholder="Unit 5, Apt 12, etc. (optional)"
                            />
                          </div>

                          {/* Street Address */}
                          <div>
                            <label
                              htmlFor="streetAddress"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Street Address *
                            </label>
                            <input
                              type="text"
                              id="streetAddress"
                              required={formData.deliveryType === 'delivery'}
                              value={formData.streetAddress}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  streetAddress: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              placeholder="123 Main Street"
                            />
                          </div>

                          {/* Suburb and State */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="suburb"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Suburb *
                              </label>
                              <input
                                type="text"
                                id="suburb"
                                required={formData.deliveryType === 'delivery'}
                                value={formData.suburb}
                                onChange={(e) => {
                                  const nextSuburb = e.target.value
                                  setFormData((prev) => {
                                    if (prev.postcode.trim().length === 4) {
                                      schedulePostcodeValidation(prev.postcode, nextSuburb)
                                    }
                                    return { ...prev, suburb: nextSuburb }
                                  })
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                placeholder="Suburb"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="state"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                State *
                              </label>
                              <select
                                id="state"
                                required={formData.deliveryType === 'delivery'}
                                value={formData.state}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    state: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              >
                                <option value="">Select State</option>
                                <option value="NSW">New South Wales (NSW)</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                Currently delivering to NSW only
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Postcode - Only required for delivery */}
                      {formData.deliveryType === 'delivery' && (
                        <div>
                          <label
                            htmlFor="postcode-checkout"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Postcode *
                          </label>
                          <input
                            type="text"
                            id="postcode-checkout"
                            required={formData.deliveryType === 'delivery'}
                            value={formData.postcode}
                            onChange={(e) => handlePostcodeChange(e.target.value)}
                            onBlur={handlePostcodeBlur}
                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                              postcodeError
                                ? 'border-red-500 focus:ring-red-500'
                                : isPostcodeValid === true
                                ? 'border-green-500 focus:ring-green-500'
                                : 'border-gray-300 focus:ring-[#D4AF37]'
                            }`}
                            placeholder="2200"
                            maxLength={4}
                          />
                          {isCheckingPostcode && (
                            <p className="text-xs text-gray-500 mt-1">Checking...</p>
                          )}
                          {postcodeError && (
                            <div className="text-xs text-red-600 mt-1">
                              <p className="flex items-center mb-1">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {postcodeError}
                              </p>
                              {postcodeError.includes('Delivery unavailable') && (
                                <Link 
                                  href="/request-quote" 
                                  className="text-[#D4AF37] font-semibold hover:underline inline-flex items-center mt-1"
                                >
                                  Request a Custom Quote →
                                </Link>
                              )}
                            </div>
                          )}
                          {isPostcodeValid === true && !postcodeError && (
                            <p className="text-xs text-green-600 mt-1 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Delivery available to this postcode
                            </p>
                          )}
                        </div>
                      )}

                      {/* Pickup Location Info */}
                      {formData.deliveryType === 'pickup' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            <strong>Pickup Location:</strong> Please collect your order from our kitchen.
                            We'll contact you when your order is ready.
                          </p>
                        </div>
                      )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="deliveryDate"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            {formData.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} Date *
                        </label>
                        <input
                          type="date"
                          id="deliveryDate"
                          required
                          min={effectiveMinDeliveryDateStr}
                          max={maxDeliveryDateStr}
                          value={formData.deliveryDate}
                          onChange={(e) => {
                            const nextDate = e.target.value
                            if (!nextDate) {
                              setFormData({
                                ...formData,
                                deliveryDate: '',
                              })
                              return
                            }
                            if (!isValidDateInput(nextDate)) {
                              setError('Please enter a valid delivery date')
                              return
                            }
                            if (nextDate < effectiveMinDeliveryDateStr) {
                              setError(
                                orderType === 'EVENT'
                                  ? 'Please select an event delivery date at least 7 days from now.'
                                  : 'Please select a delivery date at least 48 hours from now.'
                              )
                              return
                            }
                            if (nextDate > maxDeliveryDateStr) {
                              setError('Please select a delivery date within the next 12 months.')
                              return
                            }
                            setFormData({
                              ...formData,
                              deliveryDate: nextDate,
                            })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="deliveryTime"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            {formData.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} Time *
                        </label>
                        <input
                          type="time"
                          id="deliveryTime"
                          required
                          value={formData.deliveryTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliveryTime: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          placeholder="+61 4XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>
                )}

                    {/* Prebookings Info - Show when only prebookings are selected */}
                    {items.length === 0 && selectedPrebookings.length > 0 && (
                      <>
                        <div className="bg-[#D4AF37] bg-opacity-10 border border-[#D4AF37] border-opacity-30 rounded-lg p-4 mb-6">
                          <h3 className="text-lg font-semibold mb-2 text-[#D4AF37]">
                            Confirming Prebookings
                          </h3>
                          <p className="text-sm text-gray-700">
                            You are confirming {selectedPrebookings.length} prebooking(s). 
                            Please provide your contact and address information below.
                            The prebookings will be confirmed upon payment.
                          </p>
                        </div>
                        
                        {/* Contact Information for Prebookings */}
                        <div className="space-y-4 mb-6">
                          <h3 className="text-lg font-semibold">Contact Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="name-prebooking"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Full Name *
                              </label>
                              <input
                                type="text"
                                id="name-prebooking"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="email-prebooking"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Email Address *
                              </label>
                              <input
                                type="email"
                                id="email-prebooking"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                placeholder="john@example.com"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="phoneNumber-prebooking"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              id="phoneNumber-prebooking"
                              required
                              value={formData.phoneNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phoneNumber: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              placeholder="+61 4XX XXX XXX"
                            />
                          </div>
                        </div>

                        {/* Address Information for Prebookings */}
                        <div className="space-y-4 mt-6">
                          <h3 className="text-lg font-semibold">Address Information</h3>
                          
                          {/* Unit/Apartment Number (Optional) */}
                          <div>
                            <label
                              htmlFor="unitNumber-prebooking"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Unit/Apartment Number
                            </label>
                            <input
                              type="text"
                              id="unitNumber-prebooking"
                              value={formData.unitNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  unitNumber: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              placeholder="Unit 5, Apt 12, etc. (optional)"
                            />
                          </div>

                          {/* Street Address */}
                          <div>
                            <label
                              htmlFor="streetAddress-prebooking"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Street Address *
                            </label>
                            <input
                              type="text"
                              id="streetAddress-prebooking"
                              required
                              value={formData.streetAddress}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  streetAddress: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              placeholder="123 Main Street"
                            />
                          </div>

                          {/* Suburb and State */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="suburb-prebooking"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Suburb *
                              </label>
                              <input
                                type="text"
                                id="suburb-prebooking"
                                required
                                value={formData.suburb}
                                onChange={(e) => {
                                  const nextSuburb = e.target.value
                                  setFormData((prev) => {
                                    if (prev.postcode.trim().length === 4) {
                                      schedulePostcodeValidation(prev.postcode, nextSuburb)
                                    }
                                    return { ...prev, suburb: nextSuburb }
                                  })
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                placeholder="Suburb"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="state-prebooking"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                State *
                              </label>
                              <select
                                id="state-prebooking"
                                required
                                value={formData.state}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    state: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              >
                                <option value="">Select State</option>
                                <option value="NSW">New South Wales (NSW)</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                Currently delivering to NSW only
                              </p>
                            </div>
                          </div>

                          {/* Postcode */}
                          <div>
                            <label
                              htmlFor="postcode-prebooking"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Postcode *
                            </label>
                            <input
                              type="text"
                              id="postcode-prebooking"
                              required
                              value={formData.postcode}
                              onChange={(e) => handlePostcodeChange(e.target.value)}
                              onBlur={handlePostcodeBlur}
                              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                                postcodeError
                                  ? 'border-red-500 focus:ring-red-500'
                                  : isPostcodeValid === true
                                  ? 'border-green-500 focus:ring-green-500'
                                  : 'border-gray-300 focus:ring-[#D4AF37]'
                              }`}
                              placeholder="2200"
                              maxLength={4}
                            />
                            {isCheckingPostcode && (
                              <p className="text-xs text-gray-500 mt-1">Checking...</p>
                            )}
                            {postcodeError && (
                              <div className="text-xs text-red-600 mt-1">
                                <p className="flex items-center mb-1">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {postcodeError}
                                </p>
                                {postcodeError.includes('Delivery unavailable') && (
                                  <Link 
                                    href="/request-quote" 
                                    className="text-[#D4AF37] font-semibold hover:underline inline-flex items-center mt-1"
                                  >
                                    Request a Custom Quote →
                                  </Link>
                                )}
                              </div>
                            )}
                            {isPostcodeValid === true && !postcodeError && (
                              <p className="text-xs text-green-600 mt-1 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Delivery available to this postcode
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Step 1 Navigation */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        Back to Cart
                      </button>
                      <button
                        type="button"
                        onClick={orderValueMode === 'quote_only' ? goToQuoteRequest : handleNextStep}
                        disabled={orderValueMode !== 'quote_only' && !canProceedToStep2}
                        className="px-6 py-2 bg-[#D4AF37] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        {orderValueMode === 'quote_only' ? 'Request Quote →' : 'Continue to Payment →'}
                      </button>
                    </div>
                    {!canProceedToStep2 && orderValueMode !== 'quote_only' && step2BlockingReason && (
                      <p className="text-sm text-amber-700 text-right">{step2BlockingReason}</p>
                    )}
                  </div>
                )}

                {/* Step 2: Payment Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                <div>
                      <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
                      <p className="text-gray-600 text-sm">
                        {formData.paymentMethod === 'stripe'
                          ? 'Secure card payment via Stripe'
                          : 'Pay by bank transfer (no surcharge)'}
                      </p>
                      {formData.paymentMethod === 'stripe' && (
                        <p className="text-xs text-gray-500 mt-2">
                          Card payments incur a 3.5% processing fee.
                        </p>
                      )}
                    </div>
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 sm:p-5 space-y-3">
                    <h3 className="text-base font-semibold text-amber-950">Allergen Disclaimer</h3>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      Eliora Signature Catering Pty Ltd prepares food in a kitchen that handles common allergens,
                      including nuts, dairy, gluten, eggs, seafood, sesame, and soy.
                    </p>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      We take care in food preparation but cannot guarantee products are allergen-free. We do not cater
                      for allergy requests.
                    </p>
                    <p className="text-sm font-medium text-amber-950">By ordering, you acknowledge that:</p>
                    <ul className="text-sm text-amber-900 list-disc pl-5 space-y-1 leading-relaxed">
                      <li>
                        Cross-contamination may occur, and Eliora Signature Catering Pty Ltd is not liable for allergic
                        reactions.
                      </li>
                      <li>For events, it is your responsibility to inform guests of this disclaimer.</li>
                    </ul>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      By ticking the acceptance box, you confirm you have read, understood, and agreed to this disclaimer.
                    </p>
                    <label className="mt-2 flex items-start gap-2 text-sm font-medium text-amber-900">
                      <input
                        type="checkbox"
                        checked={allergyConsentAcknowledged}
                        onChange={(e) => {
                          setAllergyConsentAcknowledged(e.target.checked)
                          if (e.target.checked) {
                            setAllergyConsentError('')
                          }
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <span>I confirm I have read, understood, and agreed to the allergen disclaimer above.</span>
                    </label>
                    {allergyConsentError && (
                      <p className="mt-2 text-sm text-red-700">{allergyConsentError}</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {/* Payment method selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'stripe' })}
                        className={`p-4 border-2 rounded-lg text-left ${formData.paymentMethod === 'stripe' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-300 bg-white'}`}
                      >
                        <div className="font-medium text-lg">💳 Stripe (Card)</div>
                        <div className="text-sm text-gray-600 mt-1">Pay now with Visa/Mastercard/Amex</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'bank_transfer' })}
                        className={`p-4 border-2 rounded-lg text-left ${formData.paymentMethod === 'bank_transfer' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-300 bg-white'}`}
                      >
                        <div className="font-medium text-lg">🏦 Bank Transfer</div>
                        <div className="text-sm text-gray-600 mt-1">No surcharge. Bank details shown after order placement.</div>
                      </button>
                    </div>

                    {/* Card Payment - Stripe */}
                    {formData.paymentMethod === 'stripe' && (
                    <>
                    <div className="p-4 border-2 border-[#D4AF37] rounded-lg bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium text-lg">💳 Card</span>
                          <span className="text-sm text-gray-600 mt-1">Secure payment via Stripe</span>
                          <span className="text-xs text-[#0F3D3E]/80 mt-1">
                            Full amount will be charged now: ${stripePayableNow.toFixed(2)} (includes 3.5% card processing fee).
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/visa.svg" alt="Visa" className="h-8 w-12 object-contain opacity-60" />
                          <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mastercard.svg" alt="Mastercard" className="h-8 w-12 object-contain opacity-60" />
                          <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/americanexpress.svg" alt="American Express" className="h-8 w-12 object-contain opacity-60" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 shadow-sm">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">Secure Card Payment</h4>
                          <p className="text-sm text-gray-600">
                            Your payment is processed securely by Stripe. We never store your card details.
                          </p>
                        </div>

                        {isCreatingPaymentIntent ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">Initializing secure payment...</p>
                          </div>
                        ) : stripeClientSecret ? (
                          <div>
                            {error && (
                              <div className="mb-4 bg-red-50 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
                                <div className="flex items-start">
                                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  <div>
                                    <p className="font-semibold mb-1">Payment Error</p>
                                    <p>{error}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <StripeProvider clientSecret={stripeClientSecret}>
                              <StripeCardElement
                              clientSecret={stripeClientSecret}
                              cardholderName={formData.cardholderName}
                              onCardholderNameChange={(value) =>
                                setFormData((prev) => ({ ...prev, cardholderName: value }))
                              }
                              onPaymentSuccess={async (paymentIntentId) => {
                                if (!allergyConsentAcknowledged) {
                                  const consentError = 'You must accept the allergy disclaimer before proceeding'
                                  setAllergyConsentError(consentError)
                                  setError(consentError)
                                  return
                                }
                                // Verify payment intent status before proceeding
                                try {
                                  const verifyResponse = await fetch('/api/payments/confirm', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    credentials: 'include',
                                    body: JSON.stringify({ paymentIntentId }),
                                  })

                                  if (!verifyResponse.ok) {
                                    const errorData = await verifyResponse.json()
                                    setError(errorData.error || 'Payment verification failed')
                                    return
                                  }

                                  const paymentData = await verifyResponse.json()
                                  if (paymentData.status !== 'succeeded') {
                                    setError('Payment was not successful. Please try again.')
                                    return
                                  }

                                  // Payment verified - store payment intent ID
                                  setStripePaymentIntentId(paymentIntentId)
                                  setStripePaymentSucceeded(true)
                                  setError('') // Clear any errors

                                  // If only prebookings (no meal items), process immediately and redirect
                                  if (items.length === 0 && selectedPrebookings.length > 0) {
                                    // Use requestAnimationFrame to ensure React has finished rendering before async operations
                                    requestAnimationFrame(async () => {
                                      setIsSubmitting(true)
                                      try {
                                      // Confirm prebookings
                                      console.log('Confirming prebookings after payment:', selectedPrebookings.map(pb => pb.id))
                                      await Promise.all(
                                        selectedPrebookings.map(prebooking =>
                                          updatePrebooking.mutateAsync({
                                            id: prebooking.id,
                                            data: {
                                              status: 'CONFIRMED',
                                            },
                                          })
                                        )
                                      )
                                      console.log('Prebookings confirmed successfully')

                                      // Send confirmation email
                                      try {
                                        console.log('Sending confirmation email to:', formData.email.trim())
                                        const emailData = {
                                          email: formData.email.trim(),
                                          name: formData.name.trim(),
                                          phoneNumber: formData.phoneNumber.trim(),
                                          orderId: null,
                                          prebookingIds: selectedPrebookings.map(pb => pb.id),
                                          items: [],
                                          prebookings: selectedPrebookings.map(pb => ({
                                            eventName: pb.event?.name || 'Event',
                                            guestCount: pb.guestCount,
                                            total: calculatePrebookingTotal(pb.specialRequests),
                                          })),
                                          totalAmount: prebookingsSubtotal + eventsDeliveryFees,
                                          deliveryDate: '',
                                          deliveryTime: '',
                                          deliveryType: '',
                                          streetAddress: formData.streetAddress,
                                          unitNumber: formData.unitNumber,
                                          suburb: formData.suburb,
                                          state: formData.state,
                                          postcode: formData.postcode,
                                        }
                                        
                                        const emailResponse = await fetch('/api/orders/send-confirmation', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          credentials: 'include',
                                          body: JSON.stringify(emailData),
                                        })

                                        const emailResult = await emailResponse.json()
                                        if (!emailResponse.ok) {
                                          console.error('Failed to send confirmation email:', emailResult)
                                        } else {
                                          console.log('Confirmation email sent successfully:', emailResult)
                                        }
                                      } catch (emailError) {
                                        console.error('Error sending confirmation email:', emailError)
                                        // Don't fail the order if email fails
                                      }

                                        // Redirect to success page after a brief delay to ensure component state is stable
                                        setTimeout(() => {
                                          router.push(`/?success=true&payment=${paymentIntentId}&prebookings=confirmed`)
                                        }, 100)
                                      } catch (err: any) {
                                        setError(err.message || 'Failed to confirm prebookings')
                                        setIsSubmitting(false)
                                      }
                                    })
                                  } else {
                                    // For meal items, auto-submit order immediately after successful Stripe payment.
                                    if (!stripeAutoSubmitTriggeredRef.current) {
                                      stripeAutoSubmitTriggeredRef.current = true
                                      setCurrentStep(3)
                                      requestAnimationFrame(() => {
                                        checkoutFormRef.current?.requestSubmit()
                                      })
                                    }
                                  }
                                } catch (err: any) {
                                  setError('Failed to verify payment. Please try again.')
                                  console.error('Payment verification error:', err)
                                }
                              }}
                              onPaymentError={(errorMessage) => {
                                setError(`Payment failed: ${errorMessage}`)
                                // Reset payment intent ID on error
                                setStripePaymentIntentId(null)
                                setStripePaymentSucceeded(false)
                                stripeAutoSubmitTriggeredRef.current = false
                              }}
                              disabled={isSubmitting || !allergyConsentAcknowledged}
                            />
                            </StripeProvider>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">Click to initialize secure payment</p>
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-300">
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs text-gray-600">
                                <strong>PCI Compliant:</strong> Your card details are encrypted and processed securely by Stripe. 
                                We never see or store your full card number.
                              </p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs text-gray-600">
                                <strong>Supported Cards:</strong> Visa, Mastercard, and American Express cards issued in Australia.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {formData.paymentMethod === 'bank_transfer' && (
                    <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-800">Bank Transfer</h4>
                      <p className="text-sm text-gray-700">
                        Your order will be created as <strong>pending payment</strong>. We will show bank account details after you place the order.
                      </p>
                      <p className="text-sm text-gray-700">
                        {bankPartialDeposit
                          ? '30% deposit now to confirm your order. The remaining 70% is due 5 days before your event.'
                          : 'Please transfer the full amount to confirm your booking.'}
                      </p>
                      <p className="text-sm text-gray-700">
                        {bankPartialDeposit ? (
                          <>
                            Deposit now (30%): <strong>${bankDepositNow.toFixed(2)}</strong> | Order total:{' '}
                            <strong>${total.toFixed(2)}</strong> | Remaining (70%):{' '}
                            <strong>${remainingAfterBankDeposit.toFixed(2)}</strong>
                          </>
                        ) : (
                          <>
                            Amount due: <strong>${bankDepositNow.toFixed(2)}</strong> | Order total:{' '}
                            <strong>${total.toFixed(2)}</strong>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-700">
                        Use your order ID as the payment reference.
                      </p>
                    </div>
                  )}

                    {/* Step 2 Navigation */}
                    <div className="flex justify-between space-x-4 pt-6 border-t">
                      {items.length > 0 ? (
                        <button
                          type="button"
                          onClick={handlePreviousStep}
                          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          ← Back to Delivery
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => router.push('/cart')}
                          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          ← Back to Cart
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={orderValueMode === 'quote_only' ? goToQuoteRequest : handleNextStep}
                        disabled={orderValueMode !== 'quote_only' && !canProceedToStep3}
                        className="px-6 py-2 bg-[#D4AF37] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        {orderValueMode === 'quote_only' ? 'Request Quote →' : 'Review Order →'}
                      </button>
                </div>
                  </div>
                  </div>
                )}

                {/* Step 3: Review & Confirm */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Review Your Order</h2>
                      <p className="text-gray-600 text-sm">Please review your details before confirming</p>
                    </div>
                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}

                    {/* Delivery Summary */}
                    {items.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Delivery Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium capitalize">{formData.deliveryType}</span>
                          </div>
                          {formData.deliveryType === 'delivery' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Street Address:</span>
                                <span className="font-medium text-right max-w-xs">
                                  {formData.unitNumber ? `${formData.unitNumber}, ` : ''}
                                  {formData.streetAddress}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Suburb:</span>
                                <span className="font-medium">{formData.suburb}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">State:</span>
                                <span className="font-medium">{formData.state}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Postcode:</span>
                                <span className="font-medium">{formData.postcode}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{new Date(formData.deliveryDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">{formData.deliveryTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{formData.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">{formData.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{formData.phoneNumber}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Summary */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Method:</span>
                          <span className="font-medium capitalize">
                            {formData.paymentMethod === 'stripe' ? 'Card (Stripe)' : 'Bank Transfer'}
                          </span>
                        </div>
                        {bankPartialDeposit && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Deposit now (30%):</span>
                              <span className="font-medium">${bankDepositNow.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Remaining (70%, due 5 days before event):</span>
                              <span className="font-medium">${remainingAfterBankDeposit.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        {formData.paymentMethod === 'stripe' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Card processing fee (3.5%):</span>
                              <span className="font-medium">${stripeFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Charged now (full amount):</span>
                              <span className="font-medium">${finalTotal.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        {formData.paymentMethod === 'bank_transfer' && !bankPartialDeposit && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amount due (bank transfer):</span>
                            <span className="font-medium">${total.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                      <div className="space-y-3">
                        {items.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Meals:</p>
                            {items.map((item, itemIndex) => (
                              <div key={cartLineKey(item, itemIndex)} className="flex justify-between text-sm mb-2 gap-2">
                                <span className="min-w-0">
                                  <span className="block font-medium text-gray-900">{item.meal.name}</span>
                                  {item.size && (
                                    <span className="block text-xs text-gray-500 mt-0.5">
                                      {cartLineSizeLabel(item.meal, item.size)}
                                    </span>
                                  )}
                                  {item.size && shouldChargeBainMarieServiceFee(item.meal, item.size) && (
                                    <span className="block text-[11px] text-gray-500 mt-1 leading-snug">
                                      {FOOD_WARMER_OPTION_DESCRIPTION}
                                    </span>
                                  )}
                                  <span className="block text-xs text-gray-600 mt-0.5">×{item.quantity}</span>
                                </span>
                                <span className="shrink-0">${(item.meal.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t">
                              <span>Meals Subtotal:</span>
                              <span>${totalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        {formData.paymentMethod === 'stripe' && (
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span>Card processing fee (3.5%)</span>
                            <span>${stripeFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-300">
                          <span>Total:</span>
                          <span className="text-[#D4AF37]">${(formData.paymentMethod === 'stripe' ? finalTotal : total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>GST (included):</span>
                          <span>${gstIncluded.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 Navigation — Stripe: no Place Order (pay on step 2; order submits automatically). Bank transfer: Place Order. */}
                    <div className="flex justify-between items-start space-x-4 pt-6 border-t">
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium shrink-0"
                      >
                        ← Back to Payment
                      </button>

                      {formData.paymentMethod === 'bank_transfer' ? (
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="submit"
                            onClick={() => {
                              if (!isSubmitting && canPlaceOrder) {
                                void handleSubmit()
                              }
                            }}
                            title={!canPlaceOrder ? placeOrderBlockingReason : 'Place order'}
                            disabled={!canPlaceOrder || isSubmitting}
                            className="px-8 py-3 bg-[#D4AF37] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                          >
                            {isSubmitting
                              ? 'Placing Order...'
                              : orderValueMode === 'quote_only'
                                ? 'Request Quote Required'
                                : 'Place Order'}
                          </button>
                          {!isSubmitting && !canPlaceOrder && (
                            <p className="text-xs text-red-700 font-medium">
                              {placeOrderBlockingReason || 'Place Order is currently disabled. Complete all required fields.'}
                            </p>
                          )}
                          {error && <p className="text-xs text-red-700 font-medium">{error}</p>}
                        </div>
                      ) : (
                        <div className="flex flex-col items-end text-right max-w-md">
                          {stripePaymentFinalized ? (
                            <p className="text-sm text-[#0F3D3E] font-medium flex items-center gap-2 justify-end">
                              <span
                                className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-[#D4AF37] border-t-transparent"
                                aria-hidden
                              />
                              Finalising your order…
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      </main>
    </PageBackground>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={(
      <PageBackground>
        <main className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading checkout...</p>
            </div>
          </div>
        </main>
      </PageBackground>
    )}>
      <CheckoutPageContent />
    </Suspense>
  )
}