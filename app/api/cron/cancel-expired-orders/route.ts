import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || bearerToken !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await prisma.order.updateMany({
    where: {
      status: 'PENDING_PAYMENT' as any,
      expiresAt: {
        lt: new Date(),
      },
      depositPaid: false,
    } as any,
    data: {
      status: 'CANCELLED' as any,
    },
  })

  return NextResponse.json({
    success: true,
    cancelledCount: result.count,
    ranAt: new Date().toISOString(),
  })
}
