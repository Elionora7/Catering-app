import type { QuoteRequest } from '@prisma/client'
import { FOOD_WARMER_OPTION_LABEL } from '@/lib/foodWarmerCopy'
import { createSmtpTransport, sendMailWithLogging } from '@/lib/mailer/createSmtpTransport'

/** Matches persisted `cartItems` JSON from quote API */
export type QuoteCartLine = {
  id: string
  name: string
  size?: string | null
  /** Customer-facing size label from checkout/cart (preferred over raw `size`). */
  sizeDisplay?: string | null
  quantity: number
  price?: number
}

function parseCartLines(cartItems: unknown): QuoteCartLine[] {
  if (!Array.isArray(cartItems)) return []
  return cartItems.filter(Boolean) as QuoteCartLine[]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatLineDisplay(item: QuoteCartLine): string {
  const sizeLabel =
    item.sizeDisplay?.trim() ||
    (item.size === 'BAIN_MARIE' ? FOOD_WARMER_OPTION_LABEL : item.size?.trim()) ||
    ''
  const size = sizeLabel ? ` (${sizeLabel})` : ''
  return `${item.name}${size} × ${item.quantity}`
}

function computeSubtotal(lines: QuoteCartLine[]): number | null {
  let sum = 0
  let hasAny = false
  for (const line of lines) {
    if (line.price != null && !Number.isNaN(line.price)) {
      hasAny = true
      sum += line.price * line.quantity
    }
  }
  return hasAny ? Number(sum.toFixed(2)) : null
}

function getBankDetails() {
  return {
    accountName:
      process.env.BANK_ACCOUNT_NAME ||
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ||
      'Eliora Signature Catering',
    bsb: process.env.BANK_BSB || process.env.NEXT_PUBLIC_BANK_BSB || '000-000',
    accountNumber:
      process.env.BANK_ACCOUNT_NUMBER ||
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ||
      '00000000',
  }
}

function shouldIncludeDepositInstructions(total: number | null): boolean {
  if (total == null) return false
  return total >= 400 && total <= 1000
}

function buildBodies(quote: QuoteRequest): { text: string; html: string } {
  const lines = parseCartLines(quote.cartItems)
  const subtotal = computeSubtotal(lines)
  const total = subtotal
  const depositRequired = shouldIncludeDepositInstructions(total)
  const depositAmount = depositRequired && total != null ? Number((total * 0.3).toFixed(2)) : null
  const remainingAmount =
    depositRequired && total != null && depositAmount != null
      ? Number((total - depositAmount).toFixed(2))
      : null
  const bankDetails = depositRequired ? getBankDetails() : null

  const preferred =
    quote.preferredDate != null
      ? new Date(quote.preferredDate).toLocaleDateString('en-AU', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—'

  const customerBlock = [
    `Name: ${quote.name}`,
    `Email: ${quote.email}`,
    `Phone: ${quote.phone}`,
  ].join('\n')

  const eventBlock = [
    `Event type: ${quote.eventType}`,
    quote.estimatedGuests != null ? `Estimated guests: ${quote.estimatedGuests}` : null,
    `Preferred date: ${preferred}`,
    `Suburb: ${quote.suburb}`,
    quote.budgetRange ? `Budget range: ${quote.budgetRange}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const messageBlock =
    quote.message && quote.message.trim()
      ? `\n\nAdditional message:\n${quote.message.trim()}`
      : ''

  const cartBlock =
    lines.length > 0
      ? [
          '',
          'Cart items:',
          ...lines.map((item) => {
            const line = formatLineDisplay(item)
            const lineTotal =
              item.price != null && !Number.isNaN(item.price)
                ? `  $${(item.price * item.quantity).toFixed(2)}`
                : ''
            return `  • ${line}${lineTotal ? `  ${lineTotal}` : ''}`
          }),
          subtotal != null ? `\n  Subtotal (from line prices): $${subtotal.toFixed(2)}` : '',
          depositRequired && depositAmount != null && remainingAmount != null
            ? [
                '',
                'Deposit instructions (30% to confirm booking):',
                `  Deposit required: $${depositAmount.toFixed(2)}`,
                `  Remaining balance: $${remainingAmount.toFixed(2)}`,
                '  Payment method: Bank transfer',
                bankDetails
                  ? `  Account Name: ${bankDetails.accountName}\n  BSB: ${bankDetails.bsb}\n  Account Number: ${bankDetails.accountNumber}`
                  : '',
                `  Payment reference / Order ID: ${quote.id}`,
              ].join('\n')
            : '',
        ].join('\n')
      : '\n\nCustom quote request – no items selected'

  const text = [
    'New quote request',
    `Reference: ${quote.id}`,
    '',
    '--- Customer ---',
    customerBlock,
    '',
    '--- Event ---',
    eventBlock,
    messageBlock,
    cartBlock,
    '',
    `Submitted: ${new Date(quote.createdAt).toLocaleString('en-AU')}`,
  ].join('\n')

  const cartRows =
    lines.length > 0
      ? lines
          .map((item) => {
            const line = escapeHtml(formatLineDisplay(item))
            const lineTotal =
              item.price != null && !Number.isNaN(item.price)
                ? `$${(item.price * item.quantity).toFixed(2)}`
                : '—'
            return `<tr>
              <td style="padding:8px;border-bottom:1px solid #eee;">${line}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${lineTotal}</td>
            </tr>`
          })
          .join('')
      : `<tr><td colspan="2" style="padding:8px;color:#666;">Custom quote request – no items selected</td></tr>`

  const subtotalRow =
    subtotal != null
      ? `<p style="margin:12px 0 0;"><strong>Subtotal (from line prices):</strong> $${subtotal.toFixed(2)}</p>`
      : ''

  const depositHtml =
    depositRequired && depositAmount != null && remainingAmount != null
      ? `<h3 style="color:#D4AF37;margin-top:20px;">Deposit instructions (30%)</h3>
         <p><strong>Deposit required:</strong> $${depositAmount.toFixed(2)}</p>
         <p><strong>Remaining balance:</strong> $${remainingAmount.toFixed(2)}</p>
         <p><strong>Payment method:</strong> Bank transfer</p>
         ${
           bankDetails
             ? `<p><strong>Account Name:</strong> ${escapeHtml(bankDetails.accountName)}</p>
                <p><strong>BSB:</strong> ${escapeHtml(bankDetails.bsb)}</p>
                <p><strong>Account Number:</strong> ${escapeHtml(bankDetails.accountNumber)}</p>`
             : ''
         }
         <p><strong>Payment reference / Order ID:</strong> ${escapeHtml(quote.id)}</p>`
      : ''

  const messageHtml =
    quote.message && quote.message.trim()
      ? `<h3 style="color:#D4AF37;margin-top:20px;">Additional message</h3><p style="white-space:pre-wrap;">${escapeHtml(quote.message.trim())}</p>`
      : ''

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#333;max-width:640px;margin:0 auto;padding:20px;">
  <div style="background:#0F3D3E;color:#fff;padding:16px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:20px;">New quote request</h1>
    <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Ref: ${escapeHtml(quote.id)}</p>
  </div>
  <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;border:1px solid #eee;border-top:0;">
    <h3 style="color:#D4AF37;margin-top:0;">Customer</h3>
    <p><strong>Name:</strong> ${escapeHtml(quote.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(quote.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(quote.phone)}</p>

    <h3 style="color:#D4AF37;margin-top:20px;">Event</h3>
    <p><strong>Event type:</strong> ${escapeHtml(quote.eventType)}</p>
    ${quote.estimatedGuests != null ? `<p><strong>Estimated guests:</strong> ${quote.estimatedGuests}</p>` : ''}
    <p><strong>Preferred date:</strong> ${escapeHtml(preferred)}</p>
    <p><strong>Suburb:</strong> ${escapeHtml(quote.suburb)}</p>
    ${quote.budgetRange ? `<p><strong>Budget range:</strong> ${escapeHtml(quote.budgetRange)}</p>` : ''}

    ${messageHtml}

    <h3 style="color:#D4AF37;margin-top:20px;">Cart items</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#D4AF37;color:#fff;">
          <th style="padding:10px;text-align:left;">Item</th>
          <th style="padding:10px;text-align:right;">Line total</th>
        </tr>
      </thead>
      <tbody>${cartRows}</tbody>
    </table>
    ${subtotalRow}
    ${depositHtml}

    <p style="margin-top:24px;font-size:12px;color:#666;">Submitted ${escapeHtml(
      new Date(quote.createdAt).toLocaleString('en-AU')
    )}</p>
  </div>
</body>
</html>`

  return { text, html }
}

/**
 * Sends a quote notification email to the business inbox (nodemailer).
 * If SMTP is not configured, logs a structured preview and returns without throwing.
 */
const DEFAULT_QUOTE_NOTIFY_EMAIL = 'info@eliorasignaturecatering.com.au'

export async function sendQuoteRequestNotification(quote: QuoteRequest): Promise<void> {
  const transport = createSmtpTransport()
  const to = process.env.QUOTE_NOTIFY_EMAIL || DEFAULT_QUOTE_NOTIFY_EMAIL
  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER ? `Quotes <${process.env.SMTP_USER}>` : undefined)

  const { text, html } = buildBodies(quote)

  if (!transport || !from) {
    console.warn(
      '[sendQuoteRequestNotification] SMTP not configured (need SMTP_HOST and EMAIL_FROM or SMTP_FROM or SMTP_USER). Preview:'
    )
    console.log(text)
    return
  }

  await sendMailWithLogging(transport, {
    from,
    to,
    replyTo: quote.email,
    subject: `New quote request — ${quote.name} (${quote.id.slice(0, 8)})`,
    text,
    html,
  })
}
