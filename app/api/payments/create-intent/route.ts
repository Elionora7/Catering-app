import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { computeOrderPricing } from '@/lib/orderPricing'
import { requiresOnlineQuote } from '@/lib/paymentRules'

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
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
    })
    
    // Provide more detailed error message for debugging
    const errorMessage = error.message || 'Failed to create payment intent'
    const errorDetails = error.type ? `${error.type}: ${errorMessage}` : errorMessage
    
    return NextResponse.json(
      { 
        error: errorDetails,
        details: process.env.NODE_ENV === 'development' ? {
          type: error.type,
          code: error.code,
          statusCode: error.statusCode,
        } : undefined,
      },
      { status: 500 }
    )
  }
}


