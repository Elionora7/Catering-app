/**
 * Online checkout payment rules (AUD, GST-inclusive totals).
 * Enforced in POST /api/orders and /api/payments/create-intent.
 */

export const FULL_PAY_MAX = 400
export const BANK_PARTIAL_MIN = 401
export const BANK_PARTIAL_MAX = 999
/** Orders at or above this total cannot pay online — request a quote. */
export const QUOTE_THRESHOLD = 1000

export const BANK_DEPOSIT_PERCENT = 0.3
export const BANK_REMAINING_PERCENT = 0.7
/** Final balance is due this many calendar days before the event date. */
export const FINAL_PAYMENT_DAYS_BEFORE_EVENT = 5

export function requiresOnlineQuote(baseTotal: number): boolean {
  return baseTotal >= QUOTE_THRESHOLD
}

/** Bank transfer: 30% now + 70% before event (401–999 only). */
export function isBankPartialDepositTier(baseTotal: number): boolean {
  return baseTotal >= BANK_PARTIAL_MIN && baseTotal <= BANK_PARTIAL_MAX
}

export function isStripeFullChargeTier(baseTotal: number): boolean {
  return baseTotal <= BANK_PARTIAL_MAX && !requiresOnlineQuote(baseTotal)
}

/**
 * Final payment (70%) must be due on or after today — i.e. event date is at least
 * (FINAL_PAYMENT_DAYS_BEFORE_EVENT) calendar days after "today" in UTC date terms.
 */
export function isEventDateValidForBankPartial(deliveryDate: Date): boolean {
  const eventUtc = Date.UTC(
    deliveryDate.getUTCFullYear(),
    deliveryDate.getUTCMonth(),
    deliveryDate.getUTCDate()
  )
  const finalDue = new Date(eventUtc)
  finalDue.setUTCDate(finalDue.getUTCDate() - FINAL_PAYMENT_DAYS_BEFORE_EVENT)
  const now = new Date()
  const startToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return finalDue.getTime() >= startToday
}

export function getFinalBalanceDueDate(deliveryDate: Date): Date {
  const d = new Date(
    Date.UTC(
      deliveryDate.getUTCFullYear(),
      deliveryDate.getUTCMonth(),
      deliveryDate.getUTCDate()
    )
  )
  d.setUTCDate(d.getUTCDate() - FINAL_PAYMENT_DAYS_BEFORE_EVENT)
  return d
}

export type OrderPaymentSchedule =
  | 'FULL_STRIPE'
  | 'FULL_BANK'
  | 'BANK_PARTIAL'

export function resolvePaymentSchedule(
  baseTotal: number,
  paymentMethod: 'STRIPE' | 'BANK_TRANSFER'
): OrderPaymentSchedule | null {
  if (requiresOnlineQuote(baseTotal)) {
    return null
  }
  if (paymentMethod === 'STRIPE') {
    return 'FULL_STRIPE'
  }
  if (isBankPartialDepositTier(baseTotal)) {
    return 'BANK_PARTIAL'
  }
  return 'FULL_BANK'
}
