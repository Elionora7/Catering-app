import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/utils/validators'
import { ZodError } from 'zod'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    console.log('[POST /api/auth/register] Registration request received')
    
    const body = await request.json()
    console.log('[POST /api/auth/register] Request body received:', { email: body.email, name: body.name })
    
    const validatedData = registerSchema.parse(body)
    console.log('[POST /api/auth/register] Validation passed')

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      console.log('[POST /api/auth/register] User already exists:', validatedData.email)
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    console.log('[POST /api/auth/register] Hashing password...')
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)
    console.log('[POST /api/auth/register] Password hashed successfully')

    console.log('[POST /api/auth/register] Creating user in database...')
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
      },
    })
    console.log('[POST /api/auth/register] User created successfully:', user.id)

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[POST /api/auth/register] Error occurred:', error)
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[POST /api/auth/register] Error name:', error.name)
      console.error('[POST /api/auth/register] Error message:', error.message)
      console.error('[POST /api/auth/register] Error stack:', error.stack)
    }
    
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      console.error('[POST /api/auth/register] Validation errors:', error.errors)
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[POST /api/auth/register] Prisma error code:', error.code)
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Return detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

