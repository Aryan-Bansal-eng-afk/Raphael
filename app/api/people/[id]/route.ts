import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generatePersonDescription } from '@/lib/gemini'

// GET — get a single person with AI description
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const person = await prisma.person.findUnique({ where: { id } })
    if (!person) return NextResponse.json({ error: 'Person not found' }, { status: 404 })

    const patient = await prisma.patientProfile.findUnique({ where: { id: person.patientId } })
    const keyFacts: string[] = JSON.parse(person.keyFacts || '[]')

    const description = await generatePersonDescription(
      patient?.preferredName || 'you',
      {
        name: person.name,
        relationshipLabel: person.relationshipLabel,
        keyFacts,
        nickname: person.nickname,
      }
    )

    return NextResponse.json({
      person: { ...person, keyFacts },
      description,
    })
  } catch (error) {
    console.error('Person GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 })
  }
}

// PATCH — update a person
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { name, nickname, relationshipLabel, phone, address, keyFacts } = body

    const updated = await prisma.person.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nickname !== undefined && { nickname }),
        ...(relationshipLabel && { relationshipLabel }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(keyFacts !== undefined && { keyFacts: JSON.stringify(keyFacts) }),
      },
    })

    return NextResponse.json({ success: true, person: { ...updated, keyFacts: JSON.parse(updated.keyFacts) } })
  } catch (error) {
    console.error('Person PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 })
  }
}

// DELETE — remove a person
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await prisma.person.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Person DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 })
  }
}
