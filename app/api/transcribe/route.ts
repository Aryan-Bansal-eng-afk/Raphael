import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { transcribeAudio } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const transcript = await transcribeAudio(buffer, audioFile.name || 'recording.webm')

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('Transcribe error:', error)
    return NextResponse.json(
      { transcript: '', error: 'Transcription failed. Please try again.' },
      { status: 200 }
    )
  }
}
