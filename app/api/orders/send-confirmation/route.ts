import { NextResponse } from 'next/server'
import {
  sendOrderConfirmationMails,
  type OrderConfirmationPayload,
} from '@/lib/mailer/orderConfirmationEmail'

/**
 * Manual / legacy resend of order confirmation (e.g. admin tools).
 * Primary path: emails are sent from POST /api/orders after the order is persisted.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      name,
      phoneNumber,
      orderId,
      items,
      totalAmount,
      subtotal,
      deliveryFee,
      orderType,
      deliveryDate,
      deliveryTime,
      deliveryType,
      streetAddress,
      unitNumber,
      suburb,
      state,
      postcode,
      paymentMethod,
      depositAmount,
      remainingAmount,
      depositRequired,
      bankPartialDeposit,
      baseTotal,
      paymentSchedule,
      finalBalanceDueDate,
      stripeFee,
    } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    const sub = Number(subtotal ?? 0)
    const df = Number(deliveryFee ?? 0)
    const bt = baseTotal != null ? Number(baseTotal) : sub + df
    const pm = paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'STRIPE'
    const partial =
      bankPartialDeposit != null ? Boolean(bankPartialDeposit) : Boolean(depositRequired)
    type Sched = import('@/lib/mailer/orderConfirmationEmail').OrderPaymentSchedule
    const validSched = (s: unknown): s is Sched =>
      s === 'FULL_STRIPE' || s === 'FULL_BANK' || s === 'BANK_PARTIAL'
    let schedule: Sched = validSched(paymentSchedule)
      ? paymentSchedule
      : pm === 'STRIPE'
        ? 'FULL_STRIPE'
        : partial
          ? 'BANK_PARTIAL'
          : 'FULL_BANK'

    const payload: OrderConfirmationPayload = {
      orderId: orderId || 'unknown',
      email: String(email).trim(),
      name: String(name).trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
      items: Array.isArray(items)
        ? items.map((item: { name?: string; quantity?: number; price?: number }) => ({
            name: String(item.name ?? ''),
            quantity: Number(item.quantity ?? 0),
            price: Number(item.price ?? 0),
          }))
        : [],
      totalAmount: Number(totalAmount ?? 0),
      baseTotal: bt,
      subtotal: sub,
      deliveryFee: df,
      orderType: orderType === 'EVENT' ? 'EVENT' : 'STANDARD',
      deliveryDate,
      deliveryTime,
      deliveryType: deliveryType === 'delivery' ? 'DELIVERY' : deliveryType === 'pickup' ? 'PICKUP' : String(deliveryType ?? 'DELIVERY'),
      streetAddress,
      unitNumber,
      suburb,
      state,
      postcode,
      paymentMethod: pm,
      stripeFee: Number(stripeFee ?? 0),
      depositAmount: Number(depositAmount ?? 0),
      remainingAmount: Number(remainingAmount ?? 0),
      bankPartialDeposit: partial,
      paymentSchedule: schedule,
      finalBalanceDueDate: finalBalanceDueDate != null ? String(finalBalanceDueDate) : null,
    }

    const dispatch = await sendOrderConfirmationMails(payload)

    return NextResponse.json({
      success: dispatch === 'SENT',
      emailStatus: dispatch,
      message:
        dispatch === 'SENT'
          ? 'Confirmation email sent successfully'
          : dispatch === 'SKIPPED_NO_SMTP'
            ? 'SMTP not configured; email not sent (see server logs)'
            : 'Confirmation email could not be sent (see server logs)',
    })
  } catch (error: any) {
    console.error('[orders/send-confirmation] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process confirmation request' },
      { status: 500 }
    )
  }
}
