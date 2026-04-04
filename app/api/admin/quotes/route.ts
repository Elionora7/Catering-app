import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  try {
    const { error: authError } = await requireAdmin(request)
    if (authError) return authError

    const quotes = await prisma.quoteRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Error fetching quote requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote requests' },
      { status: 500 }
    )
  }
}
