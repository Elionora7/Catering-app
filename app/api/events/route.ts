import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { eventSchema } from '@/utils/validators'
import { ZodError } from 'zod'

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'asc',
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const body = await request.json()
    const validatedData = eventSchema.parse(body)

    const event = await prisma.event.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        date: validatedData.date,
        location: validatedData.location || null,
        maxGuests: validatedData.maxGuests || null,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

