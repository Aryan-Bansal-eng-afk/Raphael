import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role, phone, patientName, preferredName, diagnosis, dateOfBirth, relationshipLabel } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
      },
    })

    // If patient, create patient profile
    if (role === 'patient') {
      await prisma.patientProfile.create({
        data: {
          userId: user.id,
          fullName: patientName || name,
          preferredName: preferredName || name.split(' ')[0],
          diagnosis: diagnosis || null,
          dateOfBirth: dateOfBirth || null,
          language: 'en',
        },
      })
    }

    // If guardian registering with a patient link
    if (role === 'guardian' && patientName) {
      // Find or create patient by name (simplified for MVP)
      const patientUser = await prisma.user.findFirst({
        where: { role: 'patient', name: { contains: patientName } },
        include: { patientProfile: true },
      })
      
      if (patientUser?.patientProfile) {
        await prisma.guardianPatientLink.create({
          data: {
            guardianId: user.id,
            patientId: patientUser.patientProfile.id,
            relationshipLabel: relationshipLabel || 'Guardian',
            isPrimary: true,
          },
        })
      }
    }

    return NextResponse.json({ success: true, userId: user.id, role: user.role })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
