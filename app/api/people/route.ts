import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generatePersonDescription } from '@/lib/gemini'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// GET — fetch all people for a patient
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

    const people = await prisma.person.findMany({
      where: { patientId },
      orderBy: { createdAt: 'asc' },
    })

    const peopleWithParsedFacts = people.map(p => ({
      ...p,
      keyFacts: JSON.parse(p.keyFacts || '[]'),
    }))

    return NextResponse.json({ people: peopleWithParsedFacts })
  } catch (error) {
    console.error('People GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
  }
}

// POST — add a person with optional photo
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const userId = (session.user as any).id

    const name = formData.get('name') as string
    const nickname = formData.get('nickname') as string
    const relationshipLabel = formData.get('relationshipLabel') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const keyFactsRaw = formData.get('keyFacts') as string
    const patientIdForm = formData.get('patientId') as string
    const photo = formData.get('photo') as File | null

    if (!name || !relationshipLabel) {
      return NextResponse.json({ error: 'Name and relationship required' }, { status: 400 })
    }

    let patientId = patientIdForm
    if (!patientId) {
      if ((session.user as any).role === 'patient') {
        const profile = await prisma.patientProfile.findUnique({ where: { userId } })
        patientId = profile?.id || ''
      } else {
        const link = await prisma.guardianPatientLink.findFirst({ where: { guardianId: userId } })
        patientId = link?.patientId || ''
      }
    }

    if (!patientId) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    // Handle photo upload
    let photoUrl: string | null = null
    if (photo && photo.size > 0) {
      const bytes = await photo.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })
      const filename = `person-${Date.now()}-${photo.name.replace(/\s/g, '_')}`
      await writeFile(path.join(uploadsDir, filename), buffer)
      photoUrl = `/uploads/${filename}`
    }

    const keyFacts = keyFactsRaw ? JSON.parse(keyFactsRaw) : []

    const person = await prisma.person.create({
      data: {
        patientId,
        name,
        nickname: nickname || null,
        relationshipLabel,
        phone: phone || null,
        address: address || null,
        photoUrl,
        keyFacts: JSON.stringify(keyFacts),
      },
    })

    // Generate AI description
    const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } })
    const description = await generatePersonDescription(
      patient?.preferredName || 'you',
      { name, relationshipLabel, keyFacts, nickname: nickname || null }
    )

    return NextResponse.json({
      success: true,
      person: { ...person, keyFacts },
      aiDescription: description,
    })
  } catch (error) {
    console.error('People POST error:', error)
    return NextResponse.json({ error: 'Failed to add person' }, { status: 500 })
  }
}
