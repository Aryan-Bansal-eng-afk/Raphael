import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH — resolve a LOST event
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const resolvedBy = (session.user as any).email || 'Guardian'

    const updated = await prisma.lostEvent.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedBy,
      },
    })

    return NextResponse.json({ success: true, event: updated })
  } catch (error) {
    console.error('LOST resolve error:', error)
    return NextResponse.json({ error: 'Failed to resolve event' }, { status: 500 })
  }
}
