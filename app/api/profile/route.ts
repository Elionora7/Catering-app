import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { userProfileSchema, updateUserProfileSchema } from '@/utils/validators'
import { ZodError } from 'zod'

export async function GET(request: Request) {
  try {
    const { error: authError, session } = await requireAuth(request)
    if (authError) return authError

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json(profile || null)
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    
    // Provide more detailed error information
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'UNKNOWN'
    
    // Log full error details for debugging
    console.error('Full error details:', {
      message: errorMessage,
      code: errorCode,
      meta: error?.meta,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    })
    
    // Return error with more context (but don't expose sensitive info in production)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user profile',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError, session } = await requireAuth(request)
    if (authError) return authError

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = userProfileSchema.parse(body)

    // Check if profile already exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    let profile
    if (existingProfile) {
      // Update existing profile
      profile = await prisma.userProfile.update({
        where: { userId: session.user.id },
        data: validatedData,
      })
    } else {
      // Create new profile
      profile = await prisma.userProfile.create({
        data: {
          userId: session.user.id,
          ...validatedData,
        },
      })
    }

    return NextResponse.json(profile, { status: existingProfile ? 200 : 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving user profile:', error)
    return NextResponse.json(
      { error: 'Failed to save user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { error: authError, session } = await requireAuth(request)
    if (authError) return authError

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Check if profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    let profile
    if (existingProfile) {
      // Validate with full schema to ensure all fields are validated and saved
      // This ensures phone, address, city, state, postcode, and country are all saved
      const validatedData = userProfileSchema.parse(body)
      
      // Update existing profile with all validated fields
      profile = await prisma.userProfile.update({
        where: { userId: session.user.id },
        data: validatedData,
      })
    } else {
      // For creation, we need all required fields
      const createData = userProfileSchema.parse(body)
      profile = await prisma.userProfile.create({
        data: {
          userId: session.user.id,
          ...createData,
        },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}


