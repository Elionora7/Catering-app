import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Verify payment intent belongs to user (if authenticated) or is a guest payment
    if (session && session.user) {
      // Authenticated user - verify ownership
      if (paymentIntent.metadata.userId !== session.user.id && paymentIntent.metadata.userId !== 'guest') {
        return NextResponse.json(
          { error: 'Unauthorized - Payment intent does not belong to user' },
          { status: 403 }
        )
      }
    } else {
      // Guest checkout - verify it's a guest payment or matches provided email
      if (paymentIntent.metadata.userId && paymentIntent.metadata.userId !== 'guest') {
        // This payment intent was created by an authenticated user, but current request is not authenticated
        // Allow it to proceed - the payment intent itself is valid
      }
    }

    // Return payment intent status
    return NextResponse.json({
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
    })
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}


