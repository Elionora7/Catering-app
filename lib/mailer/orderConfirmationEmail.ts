import { createSmtpTransport, sendMailWithLogging } from '@/lib/mailer/createSmtpTransport'
import { FOOD_WARMER_OPTION_DESCRIPTION } from '@/lib/foodWarmerCopy'

export type OrderConfirmationLineItem = {
  name: string
  quantity: number
  price: number
}

export type OrderPaymentSchedule = 'FULL_STRIPE' | 'FULL_BANK' | 'BANK_PARTIAL'

export type OrderConfirmationPayload = {
  orderId: string
  email: string
  name: string
  phoneNumber?: string
  items: OrderConfirmationLineItem[]
  totalAmount: number
  /** Subtotal + delivery (GST-inclusive), before card fee */
  baseTotal?: number
  subtotal: number
  deliveryFee: number
  orderType: 'STANDARD' | 'EVENT'
  deliveryDate: Date | string
  deliveryTime?: string
  /** DELIVERY / PICKUP or lowercase (normalized in builder) */
  deliveryType: string
  streetAddress?: string
  unitNumber?: string
  suburb?: string
  state?: string
  postcode?: string
  paymentMethod: 'STRIPE' | 'BANK_TRANSFER'
  allergiesNote?: string | null
  stripeFee?: number
  depositAmount: number
  remainingAmount: number
  /** Bank transfer $401–$999: 30% deposit + 70% before event */
  bankPartialDeposit?: boolean
  paymentSchedule?: OrderPaymentSchedule
  /** ISO date string — remaining balance due by this date (5 days before event) */
  finalBalanceDueDate?: string | null
}

function formatCurrency(amount: number | undefined | null) {
  return `$${Number(amount || 0).toFixed(2)}`
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Pickup address for confirmation emails — from env (see PICKUP_* in .env). */
export function getPickupLocationDisplayFromEnv(): string {
  const full =
    process.env.PICKUP_LOCATION_DISPLAY?.trim() ||
    process.env.NEXT_PUBLIC_PICKUP_LOCATION_DISPLAY?.trim()
  if (full) return full
  const street = process.env.PICKUP_ADDRESS_STREET?.trim() || ''
  const suburb = process.env.PICKUP_ADDRESS_SUBURB?.trim() || ''
  const pc = process.env.PICKUP_ADDRESS_POSTCODE?.trim() || ''
  const state = process.env.PICKUP_ADDRESS_STATE?.trim() || ''
  if (street && suburb && pc && state) {
    return `${street}, ${suburb} ${state} ${pc}`
  }
  return [street, suburb, state, pc].filter(Boolean).join(', ')
}

export function buildOrderConfirmationHtml(p: OrderConfirmationPayload): string {
  const normalizedPaymentMethod = p.paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'STRIPE'
  const bankDetails = {
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
  const businessDetails = {
    name: 'Eliora Signature Catering Pty Ltd',
    address: 'Bankstown',
    phone: '0410 759 741',
    email: process.env.BUSINESS_EMAIL || 'info@eliorasignaturecatering.com.au',
    website: 'https://eliorasignaturecatering.com.au',
  }
  const siteOrigin = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://eliorasignaturecatering.com.au'
  ).replace(/\/$/, '')
  const headerBgImageUrl = `${siteOrigin}/bck-img.png`

  const orderIncludesFoodWarmer =
    p.items?.some((item) => String(item.name).includes('Keep Food Warm')) ?? false

  const orderItemsHtml =
    p.items && p.items.length > 0
      ? p.items
          .map(
            (item) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid rgba(15,61,62,0.1); color: #0F3D3E;">${escapeHtml(item.name)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid rgba(15,61,62,0.1); text-align: center; color: #0F3D3E;">${Number(item.quantity || 0)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid rgba(15,61,62,0.1); text-align: right; color: #0F3D3E;">${formatCurrency(Number(item.price || 0))}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid rgba(15,61,62,0.1); text-align: right; color: #0F3D3E;">${formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</td>
        </tr>
      `
          )
          .join('')
      : ''

  const formattedDeliveryDate = p.deliveryDate
    ? new Date(p.deliveryDate).toLocaleDateString()
    : 'Not provided'
  const fullAddress = `${p.unitNumber ? `${p.unitNumber}, ` : ''}${p.streetAddress || ''}`.trim()
  const dt = String(p.deliveryType || '').toUpperCase()
  const isDelivery = dt === 'DELIVERY'
  const isPickup = dt === 'PICKUP'
  const pickupLocationDisplay = getPickupLocationDisplayFromEnv()
  const paymentMethodLabel = normalizedPaymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Card (Stripe)'
  const hasStripeFee = Number(p.stripeFee || 0) > 0
  const baseTotalSafe = Number(
    p.baseTotal != null ? p.baseTotal : Number(p.subtotal) + Number(p.deliveryFee)
  )
  const schedule: OrderPaymentSchedule =
    p.paymentSchedule ??
    (p.bankPartialDeposit === true
      ? 'BANK_PARTIAL'
      : p.paymentMethod === 'STRIPE'
        ? 'FULL_STRIPE'
        : 'FULL_BANK')
  const finalDueStr = p.finalBalanceDueDate
    ? new Date(p.finalBalanceDueDate).toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const headerCellStyle = [
    'background-color:#0F3D3E;',
    headerBgImageUrl
      ? `background-image:url('${escapeHtml(headerBgImageUrl)}');background-size:cover;background-position:center;`
      : '',
    'padding:22px 24px;',
    'border-bottom:4px solid #D4AF37;',
  ].join('')

  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.55; color: #0F3D3E; background: #0F3D3E; margin: 0; padding: 24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td align="center">
                <table role="presentation" width="760" cellpadding="0" cellspacing="0" style="max-width:760px;width:100%;border-collapse:collapse;background:#FFF9EB;border-radius:12px;overflow:hidden;border:1px solid rgba(212,175,55,0.45);box-shadow:0 4px 24px rgba(15,61,62,0.25);">
                  <tr>
                    <td bgcolor="#0F3D3E" style="${headerCellStyle}">
                      <h1 style="margin:0;font-size:24px;color:#FFF9EB;letter-spacing:0.02em;">Order Confirmation</h1>
                      <p style="margin:10px 0 0;font-size:14px;color:#D4AF37;font-weight:600;">${escapeHtml(businessDetails.name)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 24px;background:#FFFDF6;border-bottom:1px solid rgba(15,61,62,0.12);">
                      <p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:#0F3D3E;">${escapeHtml(businessDetails.name)}</p>
                      <p style="margin:0;font-size:13px;color:#0F3D3E;line-height:1.6;">
                        ${escapeHtml(businessDetails.address)}<br />
                        <span style="color:#D4AF37;">Phone:</span> ${escapeHtml(businessDetails.phone)} &nbsp;|&nbsp;
                        <span style="color:#D4AF37;">Email:</span> ${escapeHtml(businessDetails.email)}<br />
                        <span style="color:#D4AF37;">Website:</span> ${escapeHtml(businessDetails.website)}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px 24px;background:#FFF9EB;">
                      <p style="margin:0 0 14px;color:#0F3D3E;">Dear ${escapeHtml(p.name)},</p>
                      <p style="margin:0 0 14px;color:#0F3D3E;">Thank you for your order with Eliora Signature Catering. Your booking request has been received successfully.</p>
                      ${p.orderId ? `<p style="margin:0 0 16px;color:#0F3D3E;"><strong style="color:#D4AF37;">Order ID:</strong> ${escapeHtml(p.orderId)}</p>` : ''}

                      <h3 style="color:#0F3D3E;margin:18px 0 10px;font-size:17px;border-left:4px solid #D4AF37;padding-left:10px;">Client Details</h3>
                      <p style="margin:0;font-size:14px;color:#0F3D3E;">
                        <strong>Name:</strong> ${escapeHtml(p.name)}<br />
                        <strong>Email:</strong> ${escapeHtml(p.email)}<br />
                        <strong>Phone:</strong> ${escapeHtml(p.phoneNumber || 'Not provided')}
                      </p>

                      ${p.items && p.items.length > 0 ? `
                      <h3 style="color:#0F3D3E;margin:22px 0 10px;font-size:17px;border-left:4px solid #D4AF37;padding-left:10px;">Order Items</h3>
                      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;">
                        <thead>
                          <tr style="background-color:#0F3D3E;color:#ffffff;">
                            <th style="padding:10px 12px;text-align:left;">Item</th>
                            <th style="padding:10px 12px;text-align:center;">Quantity</th>
                            <th style="padding:10px 12px;text-align:right;">Unit Price</th>
                            <th style="padding:10px 12px;text-align:right;">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${orderItemsHtml}
                        </tbody>
                      </table>
                      ${
                        orderIncludesFoodWarmer
                          ? `<p style="margin:14px 0 0;font-size:13px;color:#0F3D3E;line-height:1.65;border-left:4px solid #D4AF37;padding-left:10px;">${escapeHtml(FOOD_WARMER_OPTION_DESCRIPTION)}</p>`
                          : ''
                      }
                      ` : ''}

                      <h3 style="color:#0F3D3E;margin:22px 0 10px;font-size:17px;border-left:4px solid #D4AF37;padding-left:10px;">${isPickup ? 'Pickup Details' : 'Delivery Details'}</h3>
                      <p style="margin:0;font-size:14px;color:#0F3D3E;">
                        ${
                          isPickup
                            ? `<strong>Type:</strong> Pickup<br />
                        <strong>Pickup location:</strong> ${pickupLocationDisplay ? escapeHtml(pickupLocationDisplay) : '<em>Configure PICKUP_ADDRESS_* or PICKUP_LOCATION_DISPLAY in environment.</em>'}<br />
                        <strong>Pickup date:</strong> ${escapeHtml(formattedDeliveryDate)}<br />
                        <strong>Pickup time:</strong> ${escapeHtml(p.deliveryTime || 'Not provided')}`
                            : `<strong>Type:</strong> Delivery<br />
                        <strong>Address:</strong> ${escapeHtml(fullAddress || 'Not provided')}<br />
                        <strong>Suburb:</strong> ${escapeHtml(p.suburb || 'Not provided')}<br />
                        <strong>State:</strong> ${escapeHtml(p.state || 'Not provided')}<br />
                        <strong>Postcode:</strong> ${escapeHtml(p.postcode || 'Not provided')}<br />
                        <strong>Delivery date:</strong> ${escapeHtml(formattedDeliveryDate)}<br />
                        <strong>Delivery time:</strong> ${escapeHtml(p.deliveryTime || 'Not provided')}`
                        }
                      </p>

                      <h3 style="color:#0F3D3E;margin:22px 0 10px;font-size:17px;border-left:4px solid #D4AF37;padding-left:10px;">Payment Summary</h3>
                      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;color:#0F3D3E;">
                        <tbody>
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);">Order Type</td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);">${p.orderType === 'STANDARD' ? 'Standard Catering' : 'Event Catering'}</td></tr>
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);">Payment Method</td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);">${paymentMethodLabel}</td></tr>
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);">Subtotal</td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);">${formatCurrency(p.subtotal)}</td></tr>
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);">Delivery Fee</td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);">${formatCurrency(p.deliveryFee)}</td></tr>
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);">Order total (excl. card fee)</td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);">${formatCurrency(baseTotalSafe)}</td></tr>
                          ${hasStripeFee ? `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);">Card processing fee (3.5%)</td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);">${formatCurrency(Number(p.stripeFee))}</td></tr>` : ''}
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);">GST (included)</td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);">${formatCurrency(Math.round((Number(p.totalAmount || 0) / 11) * 100) / 100)}</td></tr>
                          ${
                            schedule === 'FULL_STRIPE'
                              ? ''
                              : schedule === 'BANK_PARTIAL'
                                ? `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);"><strong>Deposit due now (30%)</strong></td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);"><strong>${formatCurrency(Number(p.depositAmount))}</strong></td></tr>
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);">Remaining balance (70%)</td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);">${formatCurrency(Number(p.remainingAmount))}</td></tr>
                          ${finalDueStr ? `<tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);font-size:13px;color:#0F3D3E;">Remaining balance is due by <strong>${escapeHtml(finalDueStr)}</strong> (5 days before your event).</td></tr>` : ''}
                          <tr><td style="padding:12px 0 0;"><strong style="color:#D4AF37;">Order total (food &amp; delivery)</strong></td><td style="padding:12px 0 0;text-align:right;"><strong style="color:#0F3D3E;font-size:16px;">${formatCurrency(baseTotalSafe)}</strong></td></tr>`
                                : `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(15,61,62,0.08);"><strong>Amount due (bank transfer)</strong></td><td style="padding:8px 0;text-align:right;border-bottom:1px solid rgba(15,61,62,0.08);"><strong>${formatCurrency(Number(p.depositAmount))}</strong></td></tr>
                          <tr><td style="padding:12px 0 0;"><strong style="color:#D4AF37;">Order total</strong></td><td style="padding:12px 0 0;text-align:right;"><strong style="color:#0F3D3E;font-size:16px;">${formatCurrency(baseTotalSafe)}</strong></td></tr>`
                          }
                          ${
                            schedule === 'FULL_STRIPE'
                              ? `<tr><td style="padding:12px 0 0;"><strong style="color:#D4AF37;">Total charged (incl. card fee)</strong></td><td style="padding:12px 0 0;text-align:right;"><strong style="color:#0F3D3E;font-size:16px;">${formatCurrency(p.totalAmount)}</strong></td></tr>`
                              : ''
                          }
                        </tbody>
                      </table>

                      <div style="margin-top:20px;padding:16px;background:rgba(15,61,62,0.06);border:1px solid rgba(15,61,62,0.15);border-radius:8px;border-left:4px solid #D4AF37;">
                        <p style="margin:0 0 8px;font-size:14px;color:#0F3D3E;"><strong>Payment terms</strong></p>
                        <p style="margin:0;font-size:13px;color:#0F3D3E;line-height:1.65;">
                          ${
                            schedule === 'FULL_STRIPE'
                              ? '- The <strong>full amount</strong> (including the 3.5% card processing fee) has been charged to your card.<br />- Please use your <strong>Order ID</strong> for any correspondence.'
                              : schedule === 'BANK_PARTIAL'
                                ? `- <strong>30% deposit</strong> is required now to confirm your order (transfer the deposit amount above).<br />- The <strong>remaining 70%</strong> is due by <strong>${escapeHtml(finalDueStr || 'the date shown above')}</strong> — <strong>5 days before</strong> your event date.<br />- Please use your <strong>Order ID</strong> as the payment reference for all transfers.`
                                : `- <strong>Full payment</strong> is required via bank transfer (amount shown above).<br />- Please use your <strong>Order ID</strong> as the payment reference.`
                          }
                        </p>
                      </div>

                      ${normalizedPaymentMethod === 'BANK_TRANSFER' ? `
                      <h3 style="color:#0F3D3E;margin:22px 0 10px;font-size:17px;border-left:4px solid #D4AF37;padding-left:10px;">Bank Transfer Instructions</h3>
                      <p style="margin:0;font-size:14px;color:#0F3D3E;">
                        <strong>Account Name:</strong> ${escapeHtml(bankDetails.accountName)}<br />
                        <strong>BSB:</strong> ${escapeHtml(bankDetails.bsb)}<br />
                        <strong>Account Number:</strong> ${escapeHtml(bankDetails.accountNumber)}<br />
                        <strong>Reference:</strong> ${escapeHtml(p.orderId || 'Use your Order ID')}
                      </p>
                      ` : ''}

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;">
                        <tr>
                          <td style="padding:18px 0 0;border-top:1px solid rgba(15,61,62,0.12);">
                            <p style="margin:0 0 8px;color:#0F3D3E;">Thank you for choosing Eliora Signature Catering.</p>
                            <p style="margin:0 0 8px;font-size:13px;color:#0F3D3E;">Final payment reminders will be sent prior to your event date.</p>
                            <p style="margin:0;font-size:13px;color:#0F3D3E;">For enquiries, contact us at ${escapeHtml(businessDetails.email)} or ${escapeHtml(businessDetails.phone)}.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 24px;background:#0F3D3E;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#D4AF37;letter-spacing:0.04em;">Eliora Signature Catering</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
}

export type OrderEmailDispatchStatus = 'SENT' | 'FAILED' | 'SKIPPED_NO_SMTP'

/** Plain-text part improves deliverability vs HTML-only (quote emails already send both). */
function buildOrderConfirmationPlainText(p: OrderConfirmationPayload): string {
  const lines = [
    `Order confirmation — ${p.orderId}`,
    '',
    `Hi ${p.name},`,
    '',
    `Order total: ${formatCurrency(p.totalAmount)}`,
    `Type: ${p.orderType === 'STANDARD' ? 'Standard catering' : 'Event catering'}`,
    `Delivery: ${String(p.deliveryType).toUpperCase() === 'DELIVERY' ? 'Delivery' : 'Pickup'}`,
    '',
    'Thank you for choosing Eliora Signature Catering.',
    '',
    '— Eliora Signature Catering',
  ]
  return lines.join('\n')
}

/**
 * Sends customer confirmation only. Internal business alerts use `sendInternalOrderNotification`.
 * Does not throw — logs errors. Customer send determines SENT vs FAILED.
 */
export async function sendOrderConfirmationMails(
  payload: OrderConfirmationPayload
): Promise<OrderEmailDispatchStatus> {
  const to = String(payload.email || '').trim()
  if (!to) {
    console.warn('[orderConfirmationEmail] No customer email on payload; skipping send', {
      orderId: payload.orderId,
    })
    return 'FAILED'
  }

  const html = buildOrderConfirmationHtml(payload)
  const text = buildOrderConfirmationPlainText(payload)
  const transport = createSmtpTransport()
  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER ? `Eliora Orders <${process.env.SMTP_USER}>` : undefined)

  const replyTo =
    process.env.QUOTE_NOTIFY_EMAIL?.trim() ||
    process.env.BUSINESS_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    undefined

  if (!transport || !from) {
    console.warn(
      '[orderConfirmationEmail] SMTP not configured (need SMTP_HOST and EMAIL_FROM/SMTP_FROM or SMTP_USER). Preview only.'
    )
    console.log('[orderConfirmationEmail] Would send to:', to)
    console.log('[orderConfirmationEmail] Order:', payload.orderId, 'total:', payload.totalAmount)
    return 'SKIPPED_NO_SMTP'
  }

  let customerSent = false
  try {
    console.log(
      `[orderConfirmationEmail] Sending customer confirmation → ${to} (order ${payload.orderId})`
    )
    const info = await sendMailWithLogging(transport, {
      from,
      to,
      replyTo,
      subject: `Order Confirmation${payload.orderId ? ` — ${payload.orderId}` : ''}`,
      text,
      html,
    })
    customerSent = true
    console.log(`[orderConfirmationEmail] Email sent successfully for order ${payload.orderId} → ${to}`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    })
  } catch (error) {
    console.error(`[orderConfirmationEmail] Email FAILED for order ${payload.orderId} → ${to}`, error)
  }

  return customerSent ? 'SENT' : 'FAILED'
}
