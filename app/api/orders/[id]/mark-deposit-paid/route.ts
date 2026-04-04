import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, session } = await requireAuth(request)
    if (authError) return authError

    if (session?.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: orderId } = await context.params
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (existingOrder.status !== ('PENDING_PAYMENT' as any)) {
      return NextResponse.json(
        { error: 'Deposit can only be marked as paid when order status is PENDING_PAYMENT' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        depositPaid: true,
        status: 'CONFIRMED' as any,
      } as any,
      include: {
        items: {
          include: {
            meal: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    console.log('[DepositPaid] Marked as paid', {
      orderId,
      previousStatus: existingOrder.status,
      newStatus: updatedOrder.status,
      byUserId: session?.user.id,
      at: new Date().toISOString(),
    })

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    console.error('Error marking deposit paid:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark deposit as paid' },
      { status: 500 }
    )
  }
}
