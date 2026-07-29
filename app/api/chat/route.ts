import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateRAGResponse } from '@/lib/gemini'
import { generateEmbedding } from '@/lib/gemini'
import { searchEntries } from '@/lib/vectorSearch'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, patientId } = await req.json()
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const userId = (session.user as any).id

    // Resolve patientId
    let resolvedPatientId = patientId
    
    if (!resolvedPatientId) {
      if ((session.user as any).role === 'patient') {
        const profile = await prisma.patientProfile.findUnique({ where: { userId } })
        resolvedPatientId = profile?.id
      } else {
        const link = await prisma.guardianPatientLink.findFirst({
          where: { guardianId: userId },
        })
        resolvedPatientId = link?.patientId
      }
    }

    if (!resolvedPatientId) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    // Fetch patient profile
    const patient = await prisma.patientProfile.findUnique({
      where: { id: resolvedPatientId },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // ── Intent Classification ──────────────────────────────────────────────
    const lower = message.toLowerCase()
    const isPersonRelated = /who is|tell me about|my (son|daughter|grandson|wife|husband|doctor|friend)|arjun|priya|suresh|diya/.test(lower)
    const isTaskRelated = /medicine|tablet|pill|task|today|appointment|schedule|reminder|done|complete/.test(lower)
    const isMemoryRelated = /remember|yesterday|last week|diary|what did i|when did|memory|recall/.test(lower)

    // ── Retrieve Context ───────────────────────────────────────────────────
    let personContext = ''
    let taskContext = ''
    let diaryContext = ''

    // Person context
    if (isPersonRelated) {
      const people = await prisma.person.findMany({
        where: { patientId: resolvedPatientId },
      })
      
      // Find mentioned person
      const personName = people.find(p => 
        lower.includes(p.name.toLowerCase()) || 
        (p.nickname && lower.includes(p.nickname.toLowerCase()))
      )
      
      if (personName) {
        const facts = JSON.parse(personName.keyFacts || '[]')
        personContext = `${personName.name} is the patient's ${personName.relationshipLabel}. Key facts: ${facts.join('. ')}`
      } else {
        // Return all people as context
        personContext = people.map(p => {
          const facts = JSON.parse(p.keyFacts || '[]')
          return `${p.name} (${p.relationshipLabel}): ${facts.slice(0, 2).join('. ')}`
        }).join('\n')
      }
    }

    // Task context
    if (isTaskRelated) {
      const today = new Date()
      const tasks = await prisma.task.findMany({
        where: {
          patientId: resolvedPatientId,
          recurrence: { in: ['daily', 'weekly', 'once'] },
        },
        orderBy: { scheduledTime: 'asc' },
      })
      taskContext = tasks
        .map(t => `${t.title} at ${t.scheduledTime} - ${t.isCompleted ? 'Done ✓' : 'Pending'}`)
        .join(', ')
    }

    // Diary/memory context (semantic search)
    if (isMemoryRelated || (!isPersonRelated && !isTaskRelated)) {
      const allEntries = await prisma.diaryEntry.findMany({
        where: { patientId: resolvedPatientId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      if (allEntries.length > 0) {
        const queryEmbedding = await generateEmbedding(message)
        const relevant = searchEntries(queryEmbedding, allEntries, 3, 0.2)
        
        if (relevant.length > 0) {
          diaryContext = relevant
            .map(r => `[${r.metadata.date}]: ${r.text}`)
            .join('\n\n')
        } else {
          // Fall back to recent entries
          diaryContext = allEntries
            .slice(0, 3)
            .map(e => `[${new Date(e.createdAt).toLocaleDateString('en-IN')}]: ${e.rawText}`)
            .join('\n\n')
        }
      }
    }

    // ── Calculate Age ──────────────────────────────────────────────────────
    let age = 75
    if (patient.dateOfBirth) {
      const dob = new Date(patient.dateOfBirth)
      age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

    // ── Generate Response ──────────────────────────────────────────────────
    const response = await generateRAGResponse(
      patient.preferredName,
      age,
      patient.diagnosis || 'memory difficulties',
      message,
      {
        diaryContext,
        personContext,
        taskContext,
        date: dateStr,
        time: timeStr,
      }
    )

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { response: "I'm here with you. Let me help you — could you tell me a little more about what you'd like to know?" },
      { status: 200 }
    )
  }
}
