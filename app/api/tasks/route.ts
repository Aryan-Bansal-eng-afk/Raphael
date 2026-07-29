import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateMorningBriefing } from '@/lib/gemini'

// GET — fetch tasks for a patient
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    let patientId = searchParams.get('patientId')
    const briefing = searchParams.get('briefing') === 'true'
    const userId = (session.user as any).id

    if (!patientId) {
      if ((session.user as any).role === 'patient') {
        const profile = await prisma.patientProfile.findUnique({ where: { userId } })
        patientId = profile?.id || null
      } else {
        const link = await prisma.guardianPatientLink.findFirst({ where: { guardianId: userId } })
        patientId = link?.patientId || null
      }
    }

    if (!patientId) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const tasks = await prisma.task.findMany({
      where: { patientId },
      orderBy: { scheduledTime: 'asc' },
    })

    if (briefing) {
      const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } })
      const dateStr = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
      const briefingText = await generateMorningBriefing(
        patient?.preferredName || 'Friend',
        tasks.filter(t => t.recurrence === 'daily' || t.recurrence === 'once').map(t => ({
          title: t.title,
          scheduledTime: t.scheduledTime,
        })),
        dateStr
      )
      return NextResponse.json({ tasks, briefing: briefingText })
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Tasks GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST — create a new task
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, description, scheduledTime, recurrence, category, difficulty, patientId: bodyPatientId } = body
    const userId = (session.user as any).id

    if (!title || !scheduledTime) {
      return NextResponse.json({ error: 'Title and time required' }, { status: 400 })
    }

    let patientId = bodyPatientId
    if (!patientId) {
      if ((session.user as any).role === 'patient') {
        const profile = await prisma.patientProfile.findUnique({ where: { userId } })
        patientId = profile?.id
      } else {
        const link = await prisma.guardianPatientLink.findFirst({ where: { guardianId: userId } })
        patientId = link?.patientId
      }
    }

    if (!patientId) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const task = await prisma.task.create({
      data: {
        patientId,
        title,
        description: description || null,
        scheduledTime,
        recurrence: recurrence || 'once',
        category: category || 'other',
        difficulty: difficulty || 'easy',
      },
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('Tasks POST error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
