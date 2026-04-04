import { NextResponse } from 'next/server'
import { findActiveDeliveryZone } from '@/lib/deliveryZoneLookup'

// Australian postcode format: exactly 4 digits
const AUSTRALIAN_POSTCODE_REGEX = /^\d{4}$/

function validatePostcodeFormat(postcode: string): boolean {
  return AUSTRALIAN_POSTCODE_REGEX.test(postcode.trim())
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { postcode, suburb } = body

    if (postcode == null || String(postcode).trim() === '') {
      return NextResponse.json(
        { valid: false, message: 'Postcode is required.' },
        { status: 400 }
      )
    }

    const trimmedSuburb = String(suburb ?? '').trim()
    if (!trimmedSuburb) {
      return NextResponse.json(
        { valid: false, message: 'Suburb is required.' },
        { status: 400 }
      )
    }

    const trimmedPostcode = String(postcode).trim()

    // Validate postcode format: must be exactly 4 digits (Australian format)
    if (!validatePostcodeFormat(trimmedPostcode)) {
      return NextResponse.json(
        { valid: false, message: 'Invalid postcode format. Please enter a 4-digit Australian postcode.' },
        { status: 400 }
      )
    }

    const zone = await findActiveDeliveryZone(trimmedPostcode, trimmedSuburb)

    if (zone) {
      return NextResponse.json({
        valid: true,
        deliveryFee: zone.deliveryFee,
        minimumOrder: zone.minimumOrder,
      })
    } else {
      return NextResponse.json({
        valid: false,
        message: 'We currently do not deliver to this suburb/postcode combination. Please check your address and try again.',
      })
    }
  } catch (error) {
    console.error('Error validating delivery zone:', error)
    return NextResponse.json(
      { valid: false, message: 'Failed to validate delivery zone. Please try again.' },
      { status: 500 }
    )
  }
}

