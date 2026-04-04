import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { mealSchema } from '@/utils/validators'
import { ZodError } from 'zod'

export async function GET(request: Request) {
  try {
    console.log('🔍 [MEALS API] Request received')
    console.log('🔍 [MEALS API] Request URL:', request.url)
    
    // Safely parse URL and get search params
    let type: string | null = null
    try {
      const url = new URL(request.url)
      type = url.searchParams.get('type')
      console.log('🔍 [MEALS API] Type filter:', type || 'none')
    } catch (urlError: any) {
      console.error('❌ [MEALS API] Error parsing URL:', urlError?.message)
      // Continue without type filter if URL parsing fails
    }

    // Build where clause based on type filter
    const whereClause: any = {}
    
    if (type === 'daily') {
      whereClause.mealType = { in: ['DAILY', 'BOTH'] }
    } else if (type === 'event') {
      whereClause.mealType = { in: ['EVENT', 'BOTH'] }
    }

    // Build query
    const queryOptions: any = {
      orderBy: {
        createdAt: 'desc',
      },
    }
    
    if (Object.keys(whereClause).length > 0) {
      queryOptions.where = whereClause
    }

    console.log('🔍 [MEALS API] Executing Prisma query with options:', JSON.stringify(queryOptions))
    
    const meals = await prisma.meal.findMany(queryOptions)
    
    console.log(`✅ [MEALS API] Successfully fetched ${meals.length} meals`)

    return NextResponse.json(meals)
  } catch (error: any) {
    console.error('❌ [MEALS API] Error fetching meals:', error)
    console.error('❌ [MEALS API] Error name:', error?.name)
    console.error('❌ [MEALS API] Error message:', error?.message)
    console.error('❌ [MEALS API] Error code:', error?.code)
    console.error('❌ [MEALS API] Error stack:', error?.stack)
    
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'UNKNOWN'
    
    // Check for common Prisma errors
    if (errorCode === 'P1001' || errorMessage.includes("Can't reach database") || errorMessage.includes('Database connection failed')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check your database configuration and ensure the database is running.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }
    
    if (errorCode === 'P2025' || errorMessage.includes('Record to update not found')) {
      return NextResponse.json(
        { 
          error: 'Meal not found',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 404 }
      )
    }

    if (errorCode === 'P2021' || (errorMessage.includes('does not exist') && errorMessage.includes('column'))) {
      return NextResponse.json(
        { 
          error: 'Database schema error. Please run migrations: npm run db:migrate',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch meals',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        code: process.env.NODE_ENV === 'development' ? errorCode : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError } = await requireAdmin(request)
    if (authError) return authError

    const body = await request.json()
    const validatedData = mealSchema.parse(body)

    const meal = await prisma.meal.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl || null,
        category: validatedData.category || null,
        isAvailable: validatedData.isAvailable ?? true,
        mealType: validatedData.mealType ?? 'DAILY',
        pricingType: validatedData.pricingType ?? 'PER_ITEM',
        priceSmall: validatedData.priceSmall ?? null,
        priceMedium: validatedData.priceMedium ?? null,
        priceLarge: validatedData.priceLarge ?? null,
        priceBainMarie: validatedData.priceBainMarie ?? null,
        minimumQuantity: validatedData.minimumQuantity ?? null,
        isNDISReady: validatedData.isNDISReady ?? false,
        containsEgg: validatedData.containsEgg ?? false,
        containsWheat: validatedData.containsWheat ?? false,
        containsPeanut: validatedData.containsPeanut ?? false,
        isVegan: validatedData.isVegan ?? false,
        isVegetarian: validatedData.isVegetarian ?? false,
        isGlutenFree: validatedData.isGlutenFree ?? false,
        ingredients: validatedData.ingredients || null,
        allergyNotes: validatedData.allergyNotes || null,
      },
    })

    return NextResponse.json(meal, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating meal:', error)
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    )
  }
}
