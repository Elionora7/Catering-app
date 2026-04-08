import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import {
  computeOrderPricing,
  OrderPricingUserError,
  StaleCartMealsError,
} from '@/lib/orderPricing'
import { requiresOnlineQuote } from '@/lib/paymentRules'

function isStaleCartMealsError(e: unknown): e is StaleCartMealsError {
  return e instanceof StaleCartMealsError || (e instanceof Error && e.name === 'StaleCartMealsError')
}

function isOrderPricingUserError(e: unknown): e is OrderPricingUserError {
  return e instanceof OrderPricingUserError || (e instanceof Error && e.name === 'OrderPricingUserError')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currency = 'aud', metadata = {}, email, name } = body

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ?? null
    const userEmail = session?.user?.email || email || ''

    const deliveryType = body.deliveryType === 'pickup' ? 'PICKUP' : 'DELIVERY'
    const pricing = await computeOrderPricing({
      items: body.items || [],
      deliveryType,
      postcode: body.postcode,
      suburb: body.suburb,
      paymentMethod: 'STRIPE',
    })
    // Amount charged is always server-computed from cart lines + delivery (DB prices).
    // Log client hint only — strict mismatch checks caused false 400s (rounding, pickup fee state, etc.).
    const frontendTotal = Number(body.totalAmount)
    if (
      Number.isFinite(frontendTotal) &&
      Math.abs(frontendTotal - pricing.finalTotal) > 0.02 &&
      process.env.NODE_ENV === 'development'
    ) {
      console.warn('[create-intent] Client totalAmount differs from server pricing', {
        frontendTotal,
        serverFinalTotal: pricing.finalTotal,
        baseTotal: pricing.baseTotal,
        deliveryType,
      })
    }

    if (!pricing.finalTotal || pricing.finalTotal <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (requiresOnlineQuote(pricing.baseTotal)) {
      return NextResponse.json(
        {
          error:
            'Orders of $1000 or more require a quote. Online card payment is not available for this total.',
        },
        { status: 400 }
      )
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(pricing.finalTotal * 100)

    // Validate amount is at least 50 cents (Stripe minimum)
    if (amountInCents < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least $0.50 AUD' },
        { status: 400 }
      )
    }

    // Create Payment Intent with card payment method only
    // confirmation_method: 'automatic' allows client-side confirmation with publishable key
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      confirmation_method: 'automatic', // Allows client-side confirmation
      metadata: {
        userId: userId || 'guest',
        userEmail: userEmail,
        userName: name || '',
        baseTotal: pricing.baseTotal.toFixed(2),
        stripeFee: pricing.stripeFee.toFixed(2),
        finalTotal: pricing.finalTotal.toFixed(2),
        ...metadata,
      },
    })

    console.log('Created payment intent:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount_cents: paymentIntent.amount,
      amount_dollars: (paymentIntent.amount / 100).toFixed(2),
      client_secret: paymentIntent.client_secret?.substring(0, 20) + '...',
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: unknown) {
    if (isStaleCartMealsError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (isOrderPricingUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof Stripe.errors.StripeError) {
      const se = error
      console.error('[create-intent] Stripe API error:', {
        type: se.type,
        code: se.code,
        statusCode: se.statusCode,
        message: se.message,
      })
      // Wrong/missing secret key, revoked key, etc.
      if (se.type === 'StripeAuthenticationError') {
        return NextResponse.json(
          {
            error:
              process.env.NODE_ENV === 'development'
                ? se.message
                : 'Card payment could not be started. The server Stripe key may be missing or invalid—check STRIPE_SECRET_KEY on the host matches your Stripe mode (test vs live).',
          },
          { status: 502 }
        )
      }
      const http =
        typeof se.statusCode === 'number' && se.statusCode >= 400 && se.statusCode < 500 ? 400 : 502
      return NextResponse.json({ error: se.message || 'Payment provider error' }, { status: http })
    }

    const err = error as { message?: string; type?: string; code?: string; statusCode?: number; stack?: string }
    console.error('Error creating payment intent:', error)
    console.error('Error details:', {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
    })

    const errorMessage = err.message || 'Failed to create payment intent'
    const errorDetails = err.type ? `${err.type}: ${errorMessage}` : errorMessage

    return NextResponse.json(
      {
        error: errorDetails,
        details:
          process.env.NODE_ENV === 'development'
            ? {
                type: err.type,
                code: err.code,
                statusCode: err.statusCode,
              }
            : undefined,
      },
      { status: 500 }
    )
  }
}


