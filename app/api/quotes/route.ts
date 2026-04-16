import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findActiveDeliveryZone } from '@/lib/deliveryZoneLookup'
import { sendQuoteRequestNotification } from '@/lib/mailer/sendQuoteRequestNotification'
import { checkRateLimit } from '@/lib/rateLimit'
import { quoteRequestSchema } from '@/utils/validators'
import { ZodError } from 'zod'

function isSydneyPostcode(postcode: string): boolean {
  // Sydney CBD + metro range; explicitly includes requested postcodes.
  const explicit = new Set(['2060', '2088'])
  if (explicit.has(postcode)) return true

  const n = Number(postcode)
  return Number.isInteger(n) && n >= 2000 && n <= 2234
}

export async function POST(request: Request) {
  try {
    const rateLimitResponse = checkRateLimit(request, 'quotes')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validatedData = quoteRequestSchema.parse(body)
    const estimatedGuests = validatedData.estimatedGuests ?? null

    // Backend hard limit: never allow >100 guests through API (prevents client bypass).
    if (estimatedGuests != null && estimatedGuests > 100) {
      return NextResponse.json(
        {
          error: 'Maximum 100 guests allowed. Please contact us for larger events.',
        },
        { status: 400 }
      )
    }

    const trimmedPostcode = validatedData.postcode.trim()
    const trimmedSuburb = validatedData.suburb.trim()

    const deliveryZone = await findActiveDeliveryZone(trimmedPostcode, trimmedSuburb)

    if (!deliveryZone && !isSydneyPostcode(trimmedPostcode)) {
      return NextResponse.json(
        {
          error: 'We currently do not deliver to this suburb/postcode combination. Please check your address and try again.',
        },
        { status: 400 }
      )
    }

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        eventType: validatedData.eventType,
        estimatedGuests,
        preferredDate: validatedData.preferredDate || null,
        suburb: deliveryZone?.suburb || trimmedSuburb,
        budgetRange: validatedData.budgetRange || null,
        message: validatedData.message || null,
        cartItems: validatedData.cartItems,
        status: 'NEW',
      },
    })

    try {
      await sendQuoteRequestNotification(quoteRequest)
    } catch (emailErr) {
      console.error('Quote request saved but email failed:', emailErr)
    }

    return NextResponse.json(quoteRequest, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating quote request:', error)
    return NextResponse.json(
      { error: 'Failed to create quote request' },
      { status: 500 }
    )
  }
}
