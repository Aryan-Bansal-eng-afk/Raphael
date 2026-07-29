import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET — guardian dashboard overview data
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id
    
    // Get linked patient
    const link = await prisma.guardianPatientLink.findFirst({
      where: { guardianId: userId },
      include: { patient: true },
    })

    if (!link) return NextResponse.json({ error: 'No linked patient' }, { status: 404 })

    const patientId = link.patientId

    // Tasks summary
    const allTasks = await prisma.task.findMany({ where: { patientId } })
    const completedToday = allTasks.filter(t => {
      if (!t.completedAt) return false
      const today = new Date()
      const completed = new Date(t.completedAt)
      return completed.toDateString() === today.toDateString()
    })

    // Recent diary entries
    const recentDiary = await prisma.diaryEntry.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, rawText: true, moodLabel: true, createdAt: true },
    })

    // Recent LOST events
    const recentLost = await prisma.lostEvent.findMany({
      where: { patientId, resolvedAt: null },
      orderBy: { triggeredAt: 'desc' },
      take: 3,
    })

    // People count
    const peopleCount = await prisma.person.count({ where: { patientId } })

    // Mood trend (last 7 days)
    const moodTrend = await prisma.diaryEntry.findMany({
      where: {
        patientId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { moodLabel: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      patient: link.patient,
      stats: {
        totalTasks: allTasks.length,
        completedToday: completedToday.length,
        completionRate: allTasks.length > 0
          ? Math.round((completedToday.length / allTasks.length) * 100)
          : 0,
        peopleCount,
        activeLostEvents: recentLost.length,
      },
      recentDiary,
      activeLostEvents: recentLost.map(e => ({
        ...e,
        notifiedGuardians: JSON.parse(e.notifiedGuardians || '[]'),
      })),
      moodTrend,
    })
  } catch (error) {
    console.error('Guardian summary error:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
