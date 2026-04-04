import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Australian postcode format: exactly 4 digits
const AUSTRALIAN_POSTCODE_REGEX = /^\d{4}$/

function validatePostcodeFormat(postcode: string): boolean {
  return AUSTRALIAN_POSTCODE_REGEX.test(postcode.trim())
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { postcode } = body

    if (!postcode) {
      return NextResponse.json(
        { error: 'postcode is required', valid: false },
        { status: 400 }
      )
    }

    const trimmedPostcode = postcode.trim()

    // Validate postcode format: must be exactly 4 digits (Australian format)
    if (!validatePostcodeFormat(trimmedPostcode)) {
      return NextResponse.json(
        { error: 'Invalid postcode format. Please enter a 4-digit Australian postcode.', valid: false },
        { status: 400 }
      )
    }

    const zone = await prisma.deliveryZone.findFirst({
      where: { 
        postcode: trimmedPostcode,
        isActive: true 
      },
    })

    return NextResponse.json({
      valid: !!zone,
      postcode: trimmedPostcode,
    })
  } catch (error) {
    console.error('Error checking delivery zone:', error)
    return NextResponse.json(
      { error: 'Failed to check delivery zone', valid: false },
      { status: 500 }
    )
  }
}

