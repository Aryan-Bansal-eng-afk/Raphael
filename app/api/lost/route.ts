import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST — trigger LOST mode
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { latitude, longitude, address } = body
    const userId = (session.user as any).id

    // Resolve patient
    let patientId: string | null = null
    if ((session.user as any).role === 'patient') {
      const profile = await prisma.patientProfile.findUnique({ where: { userId } })
      patientId = profile?.id || null
    }

    if (!patientId) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    // Get linked guardians
    const links = await prisma.guardianPatientLink.findMany({
      where: { patientId },
      include: { guardian: true },
    })

    const guardianEmails = links.map(l => l.guardian.email)
    const guardianPhones = links.map(l => l.guardian.phone).filter(Boolean)

    // Create lost event
    const lostEvent = await prisma.lostEvent.create({
      data: {
        patientId,
        latitude: latitude || null,
        longitude: longitude || null,
        address: address || null,
        notifiedGuardians: JSON.stringify(guardianEmails),
      },
    })

    // In production: send SMS via Twilio, send FCM push notification
    // For MVP: browser notification is sent from client side
    console.log(`🆘 LOST MODE triggered for patient ${patientId}`)
    console.log(`📍 Location: ${latitude}, ${longitude}`)
    console.log(`📧 Notifying guardians: ${guardianEmails.join(', ')}`)
    console.log(`📱 Guardian phones: ${guardianPhones.join(', ')}`)

    return NextResponse.json({
      success: true,
      eventId: lostEvent.id,
      guardianCount: guardianEmails.length,
      guardianPhones,
      mapLink: latitude && longitude
        ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`
        : null,
    })
  } catch (error) {
    console.error('LOST mode error:', error)
    return NextResponse.json({ error: 'Failed to trigger LOST mode' }, { status: 500 })
  }
}

// GET — get LOST events (for guardian)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id
    const link = await prisma.guardianPatientLink.findFirst({ where: { guardianId: userId } })
    
    if (!link) return NextResponse.json({ events: [] })

    const events = await prisma.lostEvent.findMany({
      where: { patientId: link.patientId },
      orderBy: { triggeredAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      events: events.map(e => ({
        ...e,
        notifiedGuardians: JSON.parse(e.notifiedGuardians || '[]'),
      })),
    })
  } catch (error) {
    console.error('LOST events GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
