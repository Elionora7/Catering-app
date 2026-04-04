import type { CartItem } from '@/context/CartContext'
import { cartLineSizeLabel } from '@/lib/foodWarmerCopy'

export const QUOTE_REQUEST_CONTEXT_KEY = 'quote-request-context'

/** Line items stored in session + sent with quote requests (matches cart pricing logic). */
export type QuoteRequestLineItem = {
  mealId: string
  name: string
  quantity: number
  size: string | null
  /** Customer-facing size label (e.g. food warmer vs dip “Large tray”). */
  sizeDisplay?: string | null
  lineTotal: number
}

/** Snapshot of cart for quote flow (sessionStorage + API `cartItems` JSON). */
export type QuoteRequestContextPayload = {
  source: 'cart' | 'checkout'
  items: QuoteRequestLineItem[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryDate?: string
  deliveryType?: string
}

export function cartLineTotal(item: CartItem): number {
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
  return itemPrice * item.quantity + bainMarieFee * item.quantity
}

export function buildQuoteRequestContextFromCart(
  cartItems: CartItem[],
  options: {
    source: 'cart' | 'checkout'
    /** When omitted, sum of line totals. */
    subtotal?: number
    deliveryFee?: number
    deliveryDate?: string
    deliveryType?: string
  }
): QuoteRequestContextPayload {
  const lineItems: QuoteRequestLineItem[] = cartItems.map((item) => ({
    mealId: item.mealId,
    name: item.meal.name,
    quantity: item.quantity,
    size: item.size ?? null,
    sizeDisplay: item.size ? cartLineSizeLabel(item.meal, item.size) : null,
    lineTotal: Number(cartLineTotal(item).toFixed(2)),
  }))
  const computedSubtotal = cartItems.reduce((s, i) => s + cartLineTotal(i), 0)
  const subtotal = options.subtotal ?? Number(computedSubtotal.toFixed(2))
  const deliveryFee = options.deliveryFee ?? 0
  const total = Number((subtotal + deliveryFee).toFixed(2))
  return {
    source: options.source,
    items: lineItems,
    subtotal,
    deliveryFee,
    total,
    ...(options.deliveryDate ? { deliveryDate: options.deliveryDate } : {}),
    ...(options.deliveryType ? { deliveryType: options.deliveryType } : {}),
  }
}

export function saveQuoteRequestContextToSession(payload: QuoteRequestContextPayload) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(QUOTE_REQUEST_CONTEXT_KEY, JSON.stringify(payload))
}

/** Clears the quote snapshot so it cannot show stale line items after the cart is cleared. */
export function clearQuoteRequestContextFromSession() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(QUOTE_REQUEST_CONTEXT_KEY)
  } catch {
    // ignore
  }
}

/** Maps internal line items to POST /api/quotes `cartItems` body shape */
export function mapQuoteLineItemsToApiCartItems(items: QuoteRequestLineItem[]) {
  return items.map((item) => {
    const unitPrice =
      item.quantity > 0
        ? Math.round((item.lineTotal / item.quantity) * 100) / 100
        : 0
    return {
      id: item.mealId,
      name: item.name,
      size: item.size ?? undefined,
      sizeDisplay: item.sizeDisplay ?? undefined,
      quantity: item.quantity,
      price: unitPrice,
    }
  })
}
