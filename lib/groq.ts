import Groq from 'groq-sdk'

const apiKey = process.env.GROQ_API_KEY || ''

export function isGroqConfigured(): boolean {
  return apiKey !== '' && apiKey !== 'your-groq-api-key-here'
}

function getClient() {
  if (!isGroqConfigured()) {
    throw new Error('GROQ_API_KEY is not configured')
  }
  return new Groq({ apiKey })
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  if (!isGroqConfigured()) {
    return '[Voice transcription requires a Groq API key. Please check the README for setup instructions. Your audio was recorded but could not be transcribed automatically.]'
  }

  try {
    const client = getClient()

    // Convert Node Buffer → strict ArrayBuffer for TypeScript compatibility
    const arrayBuffer = audioBuffer.buffer.slice(
      audioBuffer.byteOffset,
      audioBuffer.byteOffset + audioBuffer.byteLength
    ) as ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: 'audio/webm' })
    const file = new File([blob], filename, { type: 'audio/webm' })

    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'text',
    })

    return typeof transcription === 'string' ? transcription : (transcription as any).text || ''
  } catch (error) {
    console.error('Groq transcription error:', error)
    return 'Sorry, I had trouble understanding the audio. Please try speaking again or type your message.'
  }
}
