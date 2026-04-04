import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { updateMealSchema } from '@/utils/validators'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const meal = await prisma.meal.findUnique({
      where: { id },
    })

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(meal)
  } catch (error) {
    console.error('Error fetching meal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const { error: authError } = await requireAdmin(request)
    if (authError) return authError

    const body = await request.json()
    const validatedData = updateMealSchema.parse(body)

    const existingMeal = await prisma.meal.findUnique({
      where: { id },
    })

    if (!existingMeal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      )
    }

    const meal = await prisma.meal.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description || null }),
        ...(validatedData.price !== undefined && { price: validatedData.price }),
        ...(validatedData.imageUrl !== undefined && { imageUrl: validatedData.imageUrl || null }),
        ...(validatedData.category !== undefined && { category: validatedData.category || null }),
        ...(validatedData.isAvailable !== undefined && { isAvailable: validatedData.isAvailable }),
        ...(validatedData.mealType !== undefined && { mealType: validatedData.mealType }),
        ...(validatedData.pricingType !== undefined && { pricingType: validatedData.pricingType }),
        ...(validatedData.priceSmall !== undefined && { priceSmall: validatedData.priceSmall ?? null }),
        ...(validatedData.priceMedium !== undefined && { priceMedium: validatedData.priceMedium ?? null }),
        ...(validatedData.priceLarge !== undefined && { priceLarge: validatedData.priceLarge ?? null }),
        ...(validatedData.priceBainMarie !== undefined && { priceBainMarie: validatedData.priceBainMarie ?? null }),
        ...(validatedData.minimumQuantity !== undefined && { minimumQuantity: validatedData.minimumQuantity ?? null }),
        ...(validatedData.isNDISReady !== undefined && { isNDISReady: validatedData.isNDISReady }),
        ...(validatedData.containsEgg !== undefined && { containsEgg: validatedData.containsEgg }),
        ...(validatedData.containsWheat !== undefined && { containsWheat: validatedData.containsWheat }),
        ...(validatedData.containsPeanut !== undefined && { containsPeanut: validatedData.containsPeanut }),
        ...(validatedData.isVegan !== undefined && { isVegan: validatedData.isVegan }),
        ...(validatedData.isVegetarian !== undefined && { isVegetarian: validatedData.isVegetarian }),
        ...(validatedData.isGlutenFree !== undefined && { isGlutenFree: validatedData.isGlutenFree }),
        ...(validatedData.ingredients !== undefined && { ingredients: validatedData.ingredients || null }),
        ...(validatedData.allergyNotes !== undefined && { allergyNotes: validatedData.allergyNotes || null }),
      },
    })

    return NextResponse.json(meal)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating meal:', error)
    return NextResponse.json(
      { error: 'Failed to update meal' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const { error: authError } = await requireAdmin(request)
    if (authError) return authError

    const existingMeal = await prisma.meal.findUnique({
      where: { id },
    })

    if (!existingMeal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      )
    }

    await prisma.meal.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Meal deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting meal:', error)
    return NextResponse.json(
      { error: 'Failed to delete meal' },
      { status: 500 }
    )
  }
}


