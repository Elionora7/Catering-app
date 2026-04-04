import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { shouldChargeBainMarieServiceFee } from '@/lib/dipTrayCombo'
import { prisma } from '@/lib/prisma'
import { findActiveDeliveryZone } from '@/lib/deliveryZoneLookup'
import { requireAuth } from '@/lib/auth-helpers'
import { authOptions } from '@/lib/auth'
import { createOrderSchema } from '@/utils/validators'
import { BAIN_MARIE_SERVICE_FEE, computeOrderPricing } from '@/lib/orderPricing'
import {
  getFinalBalanceDueDate,
  isBankPartialDepositTier,
  isEventDateValidForBankPartial,
  requiresOnlineQuote,
  resolvePaymentSchedule,
} from '@/lib/paymentRules'
import { sendOrderConfirmationMails } from '@/lib/mailer/orderConfirmationEmail'
import {
  buildDeliveryAddressForInternalNotification,
  sendInternalOrderNotification,
} from '@/lib/mailer/sendInternalOrderNotification'
import { getMealMinimumQuantity } from '@/lib/categoryMinimums'
import { formatOrderItemDisplayName } from '@/lib/foodWarmerCopy'
import { ZodError } from 'zod'
import bcrypt from 'bcryptjs'

/** Allow time for in-request SMTP (Vercel caps by plan; Pro+ can use 60). */
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const { error: authError, session } = await requireAuth(request)
    if (authError) return authError

    const whereClause = session?.user.role === 'ADMIN' 
      ? {} 
      : { userId: session?.user.id }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            meal: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        deliveryDate: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Guest checkout (no login required): use name + email from body. Optional session links order to account.
    const session = await getServerSession(authOptions)
    let userId: string

    if (session?.user?.id) {
      userId = session.user.id
    } else {
      if (!validatedData.email?.trim() || !validatedData.name?.trim()) {
        return NextResponse.json(
          { error: 'Email and name are required' },
          { status: 400 }
        )
      }

      const guestEmail = validatedData.email.trim().toLowerCase()
      let guestUser = await prisma.user.findUnique({
        where: { email: guestEmail },
      })

      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: {
            email: guestEmail,
            name: validatedData.name.trim(),
            password: await bcrypt.hash(Math.random().toString(36), 10),
            role: 'CUSTOMER',
          },
        })
      }

      userId = guestUser.id
    }

    // Additional validation: Event orders must have isEventConfirmed = true
    if (validatedData.orderType === 'EVENT' && !validatedData.isEventConfirmed) {
      return NextResponse.json(
        { error: 'Event orders require confirmation checkbox to be checked' },
        { status: 400 }
      )
    }

    // userId is now set above (either from session or guest user)

    // Use deliveryDate from request body (required by schema)
    const deliveryDateRaw = validatedData.deliveryDate

    // Validate and find delivery zone for postcode + suburb (only for DELIVERY orders)
    let deliveryZone = null
    let postcode = null

    if (validatedData.deliveryType === 'DELIVERY') {
      if (!validatedData.postcode) {
        return NextResponse.json(
          { error: 'Please enter a postcode for delivery.' },
          { status: 400 }
        )
      }
      if (!validatedData.suburb) {
        return NextResponse.json(
          { error: 'Please enter a suburb for delivery.' },
          { status: 400 }
        )
      }

      postcode = validatedData.postcode.trim()
      const trimmedSuburb = validatedData.suburb.trim()

      deliveryZone = await findActiveDeliveryZone(postcode, trimmedSuburb)

      if (!deliveryZone) {
        return NextResponse.json(
          {
            error: 'We do not deliver to this suburb/postcode combination. Please check your address and try again.',
          },
          { status: 400 }
        )
      }
    }

    // Validate cart items are provided
    if (!validatedData.items || validatedData.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one cart item is required' },
        { status: 400 }
      )
    }

    // Verify all meals exist and are available (dedupe IDs — cart can have multiple lines for same meal, different sizes)
    const uniqueMealIds = [...new Set(validatedData.items.map((item) => item.mealId))]
    const meals = await prisma.meal.findMany({
      where: {
        id: { in: uniqueMealIds },
        isAvailable: true,
      },
    })

    if (meals.length !== uniqueMealIds.length) {
      return NextResponse.json(
        { error: 'One or more meals not found or unavailable' },
        { status: 400 }
      )
    }

    // Calculate subtotal from cart items with size-based pricing
    const mealMap = new Map(meals.map(meal => [meal.id, meal]))
    let subtotal = 0

    for (const item of validatedData.items) {
      const meal = mealMap.get(item.mealId)
      if (!meal) {
        return NextResponse.json(
          { error: `Meal ${item.mealId} not found` },
          { status: 400 }
        )
      }

      // Calculate price based on size for SIZED items
      let itemPrice = meal.price
      if (meal.pricingType === 'SIZED' && item.size) {
        if (item.size === 'SMALL' && meal.priceSmall !== null) {
          itemPrice = meal.priceSmall
        } else if (item.size === 'MEDIUM' && meal.priceMedium !== null) {
          itemPrice = meal.priceMedium
        } else if (item.size === 'LARGE' && meal.priceLarge !== null) {
          itemPrice = meal.priceLarge
        } else if (item.size === 'BAIN_MARIE' && meal.priceBainMarie !== null) {
          itemPrice = meal.priceBainMarie
        }
      }

      const bainMarieFee = shouldChargeBainMarieServiceFee(meal, item.size) ? BAIN_MARIE_SERVICE_FEE : 0

      const minQty = getMealMinimumQuantity(meal)
      if (item.quantity < minQty) {
        return NextResponse.json(
          { error: `Minimum order quantity for this item is ${minQty}.` },
          { status: 400 }
        )
      }

      subtotal += (itemPrice * item.quantity) + (bainMarieFee * item.quantity)
    }

    // Order total (subtotal + delivery) ≥ $1000 → online payment not allowed
    const deliveryFeeForQuote =
      validatedData.deliveryType === 'DELIVERY' && deliveryZone ? deliveryZone.deliveryFee : 0
    const baseTotalForQuote = subtotal + deliveryFeeForQuote
    if (requiresOnlineQuote(baseTotalForQuote)) {
      return NextResponse.json(
        { error: 'QUOTE_REQUIRED' },
        { status: 400 }
      )
    }

    // Validate order type and date requirements using true hour-based diff.
    // `deliveryDate` arrives via Zod as a Date (coerced by z.coerce.date).
    const now = new Date()
    const deliveryDateTime = new Date(validatedData.deliveryDate)
    const diffMs = deliveryDateTime.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (validatedData.orderType === 'STANDARD') {
      // STANDARD: Minimum $100, Maximum $399, minimum 48 hours notice
      if (subtotal < 100) {
        return NextResponse.json(
          { error: 'Standard catering orders must be at least $100' },
          { status: 400 }
        )
      }
      if (subtotal >= 400) {
        return NextResponse.json(
          { error: 'Orders above $400 must be placed as Event Catering' },
          { status: 400 }
        )
      }
      if (diffHours < 48) {
        return NextResponse.json(
          { error: 'Standard catering requires at least 48 hours notice.' },
          { status: 400 }
        )
      }
    } else if (validatedData.orderType === 'EVENT') {
      // EVENT: Minimum $400, 168+ hours notice
      if (subtotal < 400) {
        return NextResponse.json(
          { error: 'Event catering orders must be at least $400' },
          { status: 400 }
        )
      }
      if (diffHours < 168) {
        return NextResponse.json(
          { error: 'Event catering requires at least 7 days notice.' },
          { status: 400 }
        )
      }
    }

    // Calculate delivery fee and determine zone
    let deliveryFee = 0
    let deliveryZoneType: 'ZONE_1' | 'ZONE_2' | 'ZONE_3' | null = null
    if (validatedData.deliveryType === 'DELIVERY') {
      if (!deliveryZone) {
        return NextResponse.json(
          { error: 'We do not currently deliver to your area.' },
          { status: 400 }
        )
      }
      deliveryFee = deliveryZone.deliveryFee
      // Determine zone type based on delivery fee
      deliveryZoneType = deliveryFee === 15 ? 'ZONE_1' : deliveryFee === 25 ? 'ZONE_2' : deliveryFee === 35 ? 'ZONE_3' : null

      // Validate minimum order for delivery zone
      if (subtotal < deliveryZone.minimumOrder) {
        return NextResponse.json(
          { error: `Minimum order for this area is $${deliveryZone.minimumOrder.toFixed(2)}` },
          { status: 400 }
        )
      }
    }

    // Calculate totals on backend only (do not trust frontend fee/total inputs).
    const baseTotalAmount = subtotal + deliveryFee
    const paymentMethod = validatedData.paymentMethod
    const pricing = await computeOrderPricing({
      items: validatedData.items.map((item) => ({
        mealId: item.mealId,
        quantity: item.quantity,
        size: item.size || null,
      })),
      deliveryType: validatedData.deliveryType,
      postcode: validatedData.postcode,
      suburb: validatedData.suburb,
      paymentMethod,
    })
    const stripeFee = pricing.stripeFee
    const totalAmount = pricing.finalTotal
    const frontendTotal = validatedData.totalAmount
    if (
      typeof frontendTotal === 'number' &&
      Number.isFinite(frontendTotal) &&
      Math.abs(frontendTotal - totalAmount) > 0.02 &&
      process.env.NODE_ENV === 'development'
    ) {
      console.warn('[orders] Client totalAmount differs from server pricing (using server totals)', {
        frontendTotal,
        serverTotal: totalAmount,
        baseTotal: pricing.baseTotal,
      })
    }

    const schedule = resolvePaymentSchedule(pricing.baseTotal, paymentMethod)
    if (!schedule) {
      return NextResponse.json({ error: 'QUOTE_REQUIRED' }, { status: 400 })
    }

    if (paymentMethod === 'BANK_TRANSFER' && isBankPartialDepositTier(pricing.baseTotal)) {
      if (!isEventDateValidForBankPartial(deliveryDateTime)) {
        return NextResponse.json(
          {
            error:
              'For bank transfer orders between $401 and $999, your event date must allow the remaining balance to be due 5 days before the event (choose a later date).',
          },
          { status: 400 }
        )
      }
    }

    const bankPartialDeposit =
      paymentMethod === 'BANK_TRANSFER' && isBankPartialDepositTier(pricing.baseTotal)

    let depositAmount: number
    let remainingAmount: number
    if (paymentMethod === 'STRIPE') {
      depositAmount = pricing.finalTotal
      remainingAmount = 0
    } else if (bankPartialDeposit) {
      depositAmount = Math.round(pricing.baseTotal * 0.3 * 100) / 100
      remainingAmount = Math.round((pricing.baseTotal - depositAmount) * 100) / 100
    } else {
      depositAmount = pricing.baseTotal
      remainingAmount = 0
    }
    const allergiesNote = validatedData.allergiesNote?.trim() || null
    const initialStatus = paymentMethod === 'BANK_TRANSFER' ? 'PENDING_PAYMENT' : 'CONFIRMED'

    const finalBalanceDueDate =
      bankPartialDeposit ? getFinalBalanceDueDate(deliveryDateTime) : null
    const expiresAt = paymentMethod === 'BANK_TRANSFER'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null
    const depositPaid = paymentMethod === 'STRIPE'

    // Get isEventConfirmed from validated data (for Event orders)
    const isEventConfirmed = validatedData.orderType === 'EVENT' ? (validatedData.isEventConfirmed ?? false) : false

    // Create order with items, delivery date, and postcode (if provided) in a transaction
    const order = await prisma.order.create({
      data: {
        userId, // Logged-in user or guest User row from checkout email
        orderType: validatedData.orderType,
        isEventConfirmed,
        subtotal,
        deliveryFee,
        stripeFee,
        totalAmount,
        depositAmount,
        remainingAmount,
        depositPaid,
        status: initialStatus as any,
        paymentMethod: paymentMethod as any,
        expiresAt,
        deliveryDate: deliveryDateRaw, // From request body
        deliveryType: validatedData.deliveryType,
        deliveryZone: deliveryZoneType,
        postcode: postcode || null, // Store postcode if provided (null for pickup)
        allergiesNote,
        deliveryZoneId: deliveryZone?.id || null, // Store delivery zone ID if provided
        items: {
          create: validatedData.items.map(item => {
            const meal = mealMap.get(item.mealId)!
            
            // Calculate final price per unit based on size
            let finalPrice = meal.price
            if (meal.pricingType === 'SIZED' && item.size) {
              if (item.size === 'SMALL' && meal.priceSmall !== null) {
                finalPrice = meal.priceSmall
              } else if (item.size === 'MEDIUM' && meal.priceMedium !== null) {
                finalPrice = meal.priceMedium
              } else if (item.size === 'LARGE' && meal.priceLarge !== null) {
                finalPrice = meal.priceLarge
              } else if (item.size === 'BAIN_MARIE' && meal.priceBainMarie !== null) {
                finalPrice = meal.priceBainMarie
              }
            }
            
            const bainMarieFee = shouldChargeBainMarieServiceFee(meal, item.size) ? BAIN_MARIE_SERVICE_FEE : 0
            finalPrice += bainMarieFee
            
            return {
              mealId: item.mealId,
              quantity: item.quantity,
              price: finalPrice, // Store final price per unit at time of order
              size: item.size || null,
              bainMarieFee: bainMarieFee,
            }
          }),
        },
      } as any,
      include: {
        items: {
          include: {
            meal: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (paymentMethod === 'STRIPE') {
      console.log('[StripeAutoConfirm] Order confirmed after successful Stripe payment', {
        orderId: order.id,
        status: order.status,
        depositPaid: (order as any).depositPaid,
        depositAmount: (order as any).depositAmount,
      })
    }

    console.log('[orders] Payment audit', {
      orderId: order.id,
      paymentSchedule: schedule,
      paymentMethod,
      baseTotal: pricing.baseTotal,
      totalAmount: order.totalAmount,
      depositAmount: order.depositAmount,
      remainingAmount: order.remainingAmount,
      bankPartialDeposit,
    })

    // Customer confirmation uses the email from the request body, not env vars.
    // Fallback to the linked User row when the client omits email/name (e.g. some logged-in flows).
    const customerEmail =
      validatedData.email?.trim() || order.user?.email?.trim() || ''
    const customerName = (() => {
      const fromBody = validatedData.name?.trim()
      if (fromBody) return fromBody
      const fromUser = order.user?.name
      return fromUser != null && String(fromUser).trim() ? String(fromUser).trim() : ''
    })()

    console.log('[orders] New order created:', {
      orderId: order.id,
      customerEmail,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
    })

    const emailPayload = {
      orderId: order.id,
      email: customerEmail,
      name: customerName,
      phoneNumber: validatedData.phoneNumber?.trim(),
      items: order.items.map((oi) => ({
        name: formatOrderItemDisplayName(oi.meal, oi.size),
        quantity: oi.quantity,
        price: oi.price,
      })),
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      orderType: order.orderType,
      deliveryDate: order.deliveryDate,
      deliveryTime: validatedData.deliveryTime,
      deliveryType: order.deliveryType,
      streetAddress: validatedData.streetAddress,
      unitNumber: validatedData.unitNumber,
      suburb: validatedData.suburb,
      state: validatedData.state,
      postcode: validatedData.postcode,
      paymentMethod: order.paymentMethod as 'STRIPE' | 'BANK_TRANSFER',
      stripeFee,
      depositAmount: order.depositAmount,
      remainingAmount: order.remainingAmount,
      bankPartialDeposit,
      paymentSchedule: schedule,
      baseTotal: pricing.baseTotal,
      finalBalanceDueDate: finalBalanceDueDate ? finalBalanceDueDate.toISOString() : null,
    }

    const internalPaymentStatusLabel =
      paymentMethod === 'STRIPE' ? 'Paid' : bankPartialDeposit ? 'Deposit' : 'Pending'

    // Await email work in the same request (do not use next/server `after()` here).
    // On Vercel serverless, work scheduled in `after()` can be cut off when the isolate freezes
    // after the response is sent — customer confirmation then never sends reliably.
    if (customerEmail && customerName) {
      console.log('[orders] Sending customer confirmation to:', customerEmail, '(order', order.id + ')')
      let emailStatus: 'SENT' | 'FAILED' = 'FAILED'
      try {
        const dispatch = await sendOrderConfirmationMails(emailPayload)
        emailStatus = dispatch === 'SENT' ? 'SENT' : 'FAILED'
        if (dispatch === 'SKIPPED_NO_SMTP') {
          console.warn(
            `[orders] Order ${order.id}: confirmation email skipped — set SMTP_HOST, SMTP_USER, SMTP_PASS on Vercel`
          )
        }
      } catch (emailErr) {
        console.error(`[orders] Unexpected error in confirmation email for order ${order.id}`, emailErr)
        emailStatus = 'FAILED'
      }
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: { emailStatus },
        })
      } catch (updateErr) {
        console.error(`[orders] Failed to persist emailStatus for order ${order.id}`, updateErr)
      }
    } else {
      console.warn(
        '[orders] No customer email/name resolved (body + user fallback); skipping customer confirmation email',
        {
          orderId: order.id,
          bodyEmail: validatedData.email?.trim() || null,
          userEmail: order.user?.email || null,
          bodyName: validatedData.name?.trim() || null,
          userName: order.user?.name || null,
        }
      )
    }

    try {
      await sendInternalOrderNotification({
        orderId: order.id,
        customerName: validatedData.name?.trim() || 'Not provided',
        customerEmail: validatedData.email?.trim() || '',
        customerPhone: validatedData.phoneNumber?.trim(),
        deliveryDate: order.deliveryDate,
        deliveryTime: validatedData.deliveryTime,
        deliveryType: validatedData.deliveryType,
        deliveryAddressDisplay: buildDeliveryAddressForInternalNotification(validatedData.deliveryType, {
          unitNumber: validatedData.unitNumber,
          streetAddress: validatedData.streetAddress,
          suburb: validatedData.suburb,
          state: validatedData.state,
          postcode: validatedData.postcode,
        }),
        items: order.items.map((oi) => ({
          name: formatOrderItemDisplayName(oi.meal, oi.size),
          quantity: oi.quantity,
          unitPrice: Number(oi.price),
          lineTotal: Number(oi.price) * oi.quantity,
        })),
        totalAmount: Number(order.totalAmount),
        paymentMethod,
        paymentStatusLabel: internalPaymentStatusLabel,
        orderStatus: String(order.status),
      })
    } catch (internalErr) {
      console.error(`[orders] Internal order notification error (non-fatal) for order ${order.id}`, internalErr)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Error creating order:', errMsg, error)
    return NextResponse.json(
      {
        error: 'Failed to create order',
        // Helps debug production (Vercel logs show full error); safe to omit in client UX
        ...(process.env.NODE_ENV === 'development' && { debug: errMsg }),
      },
      { status: 500 }
    )
  }
}


