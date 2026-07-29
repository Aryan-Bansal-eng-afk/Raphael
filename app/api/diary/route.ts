import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { analyzeDiaryEntry, generateEmbedding } from '@/lib/gemini'

// GET — fetch diary entries for a patient
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    let patientId = searchParams.get('patientId')
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

    const entries = await prisma.diaryEntry.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        rawText: true,
        moodLabel: true,
        peopleMentioned: true,
        placesMentioned: true,
        audioUrl: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Diary GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

// POST — create a new diary entry
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { text, audioUrl } = body
    const userId = (session.user as any).id

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text content required' }, { status: 400 })
    }

    // Resolve patient ID
    let patientId: string | null = null
    if ((session.user as any).role === 'patient') {
      const profile = await prisma.patientProfile.findUnique({ where: { userId } })
      patientId = profile?.id || null
    } else {
      const link = await prisma.guardianPatientLink.findFirst({ where: { guardianId: userId } })
      patientId = link?.patientId || null
    }

    if (!patientId) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    // Analyze text with Gemini
    const analysis = await analyzeDiaryEntry(text)

    // Generate embedding
    const embedding = await generateEmbedding(text)

    const entry = await prisma.diaryEntry.create({
      data: {
        patientId,
        rawText: text,
        audioUrl: audioUrl || null,
        moodLabel: analysis.mood,
        peopleMentioned: JSON.stringify(analysis.peopleMentioned),
        placesMentioned: JSON.stringify(analysis.placesMentioned),
        embedding: JSON.stringify(embedding),
      },
    })

    return NextResponse.json({ success: true, entry: { ...entry, analysis } })
  } catch (error) {
    console.error('Diary POST error:', error)
    return NextResponse.json({ error: 'Failed to save diary entry' }, { status: 500 })
  }
}
