import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findActiveDeliveryZone } from '@/lib/deliveryZoneLookup'
import { sendQuoteRequestNotification } from '@/lib/mailer/sendQuoteRequestNotification'
import { quoteRequestSchema } from '@/utils/validators'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = quoteRequestSchema.parse(body)

    const trimmedPostcode = validatedData.postcode.trim()
    const trimmedSuburb = validatedData.suburb.trim()

    const deliveryZone = await findActiveDeliveryZone(trimmedPostcode, trimmedSuburb)

    if (!deliveryZone) {
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
        estimatedGuests: validatedData.estimatedGuests || null,
        preferredDate: validatedData.preferredDate || null,
        suburb: deliveryZone.suburb,
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
