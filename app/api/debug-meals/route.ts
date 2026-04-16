// Minimal test endpoint to diagnose the issue
import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    // Test 1: Check if we can import prisma
    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.prisma
    } catch (importError: any) {
      return NextResponse.json({
        error: 'Failed to import Prisma',
        details: importError?.message,
        stack: importError?.stack,
      }, { status: 500 })
    }
    
    // Test 2: Check if prisma is available
    if (!prisma) {
      return NextResponse.json({
        error: 'Prisma client is not available',
      }, { status: 500 })
    }

    // Test 3: Try a simple query
    try {
      const count = await prisma.meal.count()
      const meals = await prisma.meal.findMany({
        take: 1,
      })
      
      return NextResponse.json({
        success: true,
        count,
        sampleMeal: meals[0] || null,
        message: 'All tests passed!',
      })
    } catch (queryError: any) {
      return NextResponse.json({
        error: 'Prisma query failed',
        details: queryError?.message,
        code: queryError?.code,
        meta: queryError?.meta,
        stack: queryError?.stack,
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      error: 'Unexpected error',
      message: error?.message,
      stack: error?.stack,
    }, { status: 500 })
  }
}
