import {
  createSmtpTransport,
  buildSmtpEnvelope,
  resolveMailFromHeader,
  sendMailWithLogging,
} from '@/lib/mailer/createSmtpTransport'
import { getPickupLocationDisplayFromEnv } from '@/lib/mailer/orderConfirmationEmail'

/**
 * Recipients for new-order alerts. Comma or semicolon separated in env.
 * If unset: QUOTE_NOTIFY_EMAIL + optional BUSINESS_ORDER_NOTIFY_CC (defaults in .env.example).
 */
export function getInternalOrderNotificationRecipients(): string[] {
  const explicit = process.env.BUSINESS_NOTIFICATION_EMAIL?.trim()
  if (explicit) {
    return explicit
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const quote = process.env.QUOTE_NOTIFY_EMAIL?.trim()
  const cc = process.env.BUSINESS_ORDER_NOTIFY_CC?.trim()
  return [quote, cc].filter(Boolean) as string[]
}

export type InternalOrderNotificationItem = {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type InternalOrderNotificationPayload = {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  deliveryDate: Date | string
  deliveryTime?: string | null
  deliveryType: 'DELIVERY' | 'PICKUP'
  deliveryAddressDisplay: string
  items: InternalOrderNotificationItem[]
  totalAmount: number
  paymentMethod: 'STRIPE' | 'BANK_TRANSFER'
  /** Short label for ops: Paid / Deposit / Pending */
  paymentStatusLabel: string
  orderStatus: string
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMoney(n: number) {
  return `$${Number(n).toFixed(2)}`
}

function formatDate(d: Date | string) {
  try {
    return new Date(d).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: undefined,
    })
  } catch {
    return String(d)
  }
}

/**
 * Human-readable delivery / pickup address for internal notifications.
 */
export function buildDeliveryAddressForInternalNotification(
  deliveryType: 'DELIVERY' | 'PICKUP',
  v: {
    unitNumber?: string | null
    streetAddress?: string | null
    suburb?: string | null
    state?: string | null
    postcode?: string | null
  }
): string {
  if (deliveryType === 'PICKUP') {
    const loc = getPickupLocationDisplayFromEnv()
    return loc ? `Pickup — ${loc}` : 'Pickup — (configure PICKUP_* in environment)'
  }
  const line1 = [v.unitNumber, v.streetAddress].filter(Boolean).join(', ')
  const line2 = [v.suburb, v.state, v.postcode].filter(Boolean).join(' ')
  const block = [line1, line2].filter(Boolean).join(' · ')
  return block || 'Not provided'
}

export function buildInternalOrderNotificationHtml(p: InternalOrderNotificationPayload): string {
  const rows = p.items
    .map(
      (row) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(row.name)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${row.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(row.unitPrice)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(row.lineTotal)}</td>
    </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
  <h2 style="color:#0F3D3E;">New catering order</h2>
  <p><strong>Order ID:</strong> ${escapeHtml(p.orderId)}</p>
  <p><strong>Order status:</strong> ${escapeHtml(p.orderStatus)}</p>
  <table style="margin:16px 0;border-collapse:collapse;">
    <tr><td style="padding:4px 12px 4px 0;"><strong>Customer</strong></td><td>${escapeHtml(p.customerName)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;"><strong>Phone</strong></td><td>${escapeHtml(p.customerPhone || '—')}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;"><strong>Email</strong></td><td>${escapeHtml(p.customerEmail || '—')}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;"><strong>${p.deliveryType === 'PICKUP' ? 'Pickup' : 'Delivery'} date</strong></td><td>${escapeHtml(formatDate(p.deliveryDate))}</td></tr>
    ${p.deliveryTime ? `<tr><td style="padding:4px 12px 4px 0;"><strong>Time</strong></td><td>${escapeHtml(p.deliveryTime)}</td></tr>` : ''}
    <tr><td style="padding:4px 12px 4px 0;vertical-align:top;"><strong>Address</strong></td><td>${escapeHtml(p.deliveryAddressDisplay)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;"><strong>Payment method</strong></td><td>${p.paymentMethod === 'STRIPE' ? 'Stripe' : 'Bank transfer'}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;"><strong>Payment status</strong></td><td>${escapeHtml(p.paymentStatusLabel)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;"><strong>Total</strong></td><td><strong>${formatMoney(p.totalAmount)}</strong></td></tr>
  </table>
  <h3 style="color:#0F3D3E;">Items</h3>
  <table style="width:100%;max-width:640px;border-collapse:collapse;">
    <thead>
      <tr style="background:#0F3D3E;color:#fff;">
        <th style="padding:8px;text-align:left;">Item</th>
        <th style="padding:8px;">Qty</th>
        <th style="padding:8px;text-align:right;">Unit</th>
        <th style="padding:8px;text-align:right;">Line</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
}

function buildInternalOrderNotificationText(p: InternalOrderNotificationPayload): string {
  const lines = [
    `New catering order — ${p.orderId}`,
    `Order status: ${p.orderStatus}`,
    `Customer: ${p.customerName}`,
    `Phone: ${p.customerPhone || '—'}`,
    `Email: ${p.customerEmail || '—'}`,
    `${p.deliveryType === 'PICKUP' ? 'Pickup' : 'Delivery'} date: ${formatDate(p.deliveryDate)}`,
    p.deliveryTime ? `Time: ${p.deliveryTime}` : null,
    `Address: ${p.deliveryAddressDisplay}`,
    `Payment: ${p.paymentMethod === 'STRIPE' ? 'Stripe' : 'Bank transfer'} — ${p.paymentStatusLabel}`,
    `Total: ${formatMoney(p.totalAmount)}`,
    '',
    'Items:',
    ...p.items.map(
      (i) =>
        `  - ${i.name} x${i.quantity} @ ${formatMoney(i.unitPrice)} = ${formatMoney(i.lineTotal)}`
    ),
  ].filter(Boolean) as string[]
  return lines.join('\n')
}

/**
 * Sends internal business alert for a new order. Does not throw — logs errors.
 * Must not block callers; safe to fire-and-forget from `after()`.
 */
export async function sendInternalOrderNotification(payload: InternalOrderNotificationPayload): Promise<void> {
  const recipients = getInternalOrderNotificationRecipients()
  if (recipients.length === 0) {
    console.warn(
      '[internalOrderNotification] No recipients — set BUSINESS_NOTIFICATION_EMAIL or QUOTE_NOTIFY_EMAIL (+ optional BUSINESS_ORDER_NOTIFY_CC)'
    )
    return
  }

  const transport = createSmtpTransport()
  const from = resolveMailFromHeader({ fallbackDisplayName: 'Eliora Orders' })

  if (!transport || !from) {
    console.warn('[internalOrderNotification] SMTP not configured; skipping internal notification')
    console.log('[internalOrderNotification] Would send to:', recipients.join(', '), 'order:', payload.orderId)
    return
  }

  const html = buildInternalOrderNotificationHtml(payload)
  const text = buildInternalOrderNotificationText(payload)
  const subject = `New Catering Order Received - #${payload.orderId}`

  const envelope = buildSmtpEnvelope(recipients)
  try {
    await sendMailWithLogging(transport, {
      from,
      to: recipients,
      subject,
      text,
      html,
      ...(envelope ? { envelope } : {}),
    })
    console.log(`[internalOrderNotification] Sent for order ${payload.orderId} → ${recipients.join(', ')}`)
  } catch (err) {
    console.error(`[internalOrderNotification] FAILED for order ${payload.orderId}`, err)
  }
}
