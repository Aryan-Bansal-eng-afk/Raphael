import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || ''

// Helper to check if API key is configured
export function isGeminiConfigured(): boolean {
  return apiKey !== '' && apiKey !== 'your-gemini-api-key-here'
}

// Get the Gemini client (only call if configured)
function getClient() {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}

// ─── CHAT / RAG ──────────────────────────────────────────────────────────────

export async function generateChatResponse(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  if (!isGeminiConfigured()) {
    return getDemoResponse(userMessage)
  }

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent(userMessage)
    return result.response.text()
  } catch (error) {
    console.error('Gemini chat error:', error)
    return getDemoResponse(userMessage)
  }
}

// ─── EMBEDDINGS ──────────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!isGeminiConfigured()) {
    // Return a deterministic mock embedding based on text length/content
    return generateMockEmbedding(text)
  }

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Gemini embedding error:', error)
    return generateMockEmbedding(text)
  }
}

// ─── VISION (Photo Description) ──────────────────────────────────────────────

export async function describeImage(imageBase64: string, mimeType: string): Promise<string> {
  if (!isGeminiConfigured()) {
    return 'A warm memory captured in this photo. Ask your guardian to add a description.'
  }

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a compassionate AI caregiver helping a person with dementia remember their memories. 
    Look at this photo and write a warm, simple 2-3 sentence description that will help them remember what it shows.
    Speak warmly, as if describing a cherished memory. Focus on people, places, and the feeling of the moment.
    Keep the language very simple and clear.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      },
    ])

    return result.response.text()
  } catch (error) {
    console.error('Gemini vision error:', error)
    return 'A beautiful memory. Ask your guardian to add more details about this photo.'
  }
}

// ─── TEXT ANALYSIS (Diary Entry) ─────────────────────────────────────────────

export async function analyzeDiaryEntry(text: string): Promise<{
  mood: string
  peopleMentioned: string[]
  placesMentioned: string[]
  summary: string
}> {
  if (!isGeminiConfigured()) {
    return {
      mood: 'calm',
      peopleMentioned: [],
      placesMentioned: [],
      summary: text.slice(0, 100) + '...',
    }
  }

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Analyze this diary entry from a person with dementia and extract:
1. Mood: one of [happy, anxious, confused, calm, sad]
2. People mentioned (first names only, as a JSON array)
3. Places mentioned (as a JSON array)
4. A brief 1-sentence summary

Diary entry: "${text}"

Respond ONLY with valid JSON in this exact format:
{"mood": "calm", "peopleMentioned": ["Priya"], "placesMentioned": ["garden"], "summary": "Had a peaceful day in the garden."}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return {
      mood: 'calm',
      peopleMentioned: [],
      placesMentioned: [],
      summary: text.slice(0, 100),
    }
  } catch (error) {
    console.error('Gemini analysis error:', error)
    return {
      mood: 'calm',
      peopleMentioned: [],
      placesMentioned: [],
      summary: text.slice(0, 100),
    }
  }
}

// ─── MORNING BRIEFING ────────────────────────────────────────────────────────

export async function generateMorningBriefing(
  patientName: string,
  tasks: Array<{ title: string; scheduledTime: string }>,
  date: string
): Promise<string> {
  if (!isGeminiConfigured()) {
    const taskList = tasks.map(t => `${t.title} at ${t.scheduledTime}`).join(', ')
    return `Good morning, ${patientName}! What a wonderful day to start fresh. Today is ${date}. ${
      tasks.length > 0
        ? `You have a few things planned today: ${taskList}.`
        : 'You have a relaxed day ahead.'
    } Take it one step at a time. You are loved and everything will be just fine.`
  }

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const taskList =
      tasks.length > 0
        ? tasks.map((t) => `${t.title} at ${t.scheduledTime}`).join(', ')
        : 'no specific tasks today — enjoy a relaxed day'

    const prompt = `You are Raphael, a warm AI caregiver. Generate a gentle, encouraging morning briefing for ${patientName}.
Today is ${date}.
Today's tasks: ${taskList}.
Keep it under 80 words. Speak directly to them by name. Start with a warm greeting.
Use very simple words. Be warm, encouraging, and calm. End with a loving line.
Do NOT use bullet points or lists — speak naturally as if talking to them.`

    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('Morning briefing error:', error)
    const taskList = tasks.map(t => `${t.title} at ${t.scheduledTime}`).join(', ')
    return `Good morning, ${patientName}! What a beautiful day. Today is ${date}. ${
      tasks.length > 0 ? `Remember to: ${taskList}.` : 'Take it easy today.'
    } You are loved very much.`
  }
}

// ─── PERSON DESCRIPTION ──────────────────────────────────────────────────────

export async function generatePersonDescription(
  patientName: string,
  person: {
    name: string
    relationshipLabel: string
    keyFacts: string[]
    nickname?: string | null
  }
): Promise<string> {
  if (!isGeminiConfigured()) {
    const facts = person.keyFacts.slice(0, 2).join('. ')
    return `${person.name} is your ${person.relationshipLabel}. ${facts}.`
  }

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Write a warm, simple 2-3 sentence description of this person to help ${patientName}, who has dementia, remember who they are.
Person: ${person.name} (${person.nickname ? `also called ${person.nickname}` : ''})
Relationship: ${person.relationshipLabel} of ${patientName}
Key facts: ${person.keyFacts.join('. ')}

Speak directly to ${patientName} in second person. Be warm and reassuring.
Example style: "Priya is your daughter. She calls you every evening and lives in Mumbai. She loves you very much."`

    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('Person description error:', error)
    const facts = person.keyFacts.slice(0, 2).join('. ')
    return `${person.name} is your ${person.relationshipLabel}. ${facts}.`
  }
}

// ─── RAG CHAT ────────────────────────────────────────────────────────────────

export async function generateRAGResponse(
  patientName: string,
  patientAge: number,
  diagnosis: string,
  query: string,
  context: {
    diaryContext?: string
    personContext?: string
    taskContext?: string
    date: string
    time: string
  }
): Promise<string> {
  const systemPrompt = `You are Raphael, a compassionate AI caregiver for ${patientName}, who is ${patientAge} years old and has ${diagnosis}. 

Your role is to gently help them remember things, stay on schedule, and feel safe and loved. 
Always speak warmly, patiently, and clearly. Use very simple language.
Address them by their name: ${patientName}.
Never say "I don't know." Instead say "Let me help you remember..." 
Never be clinical or cold. If they seem confused or distressed, reassure them first.
Keep responses concise (under 100 words) and easy to understand.

Today is ${context.date} at ${context.time}.
${context.taskContext ? `Today's tasks: ${context.taskContext}` : ''}
${context.diaryContext ? `Recent memories: ${context.diaryContext}` : ''}
${context.personContext ? `Person information: ${context.personContext}` : ''}`

  return generateChatResponse(systemPrompt, query)
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getDemoResponse(query: string): string {
  const lower = query.toLowerCase()
  
  if (lower.includes('medicine') || lower.includes('tablet') || lower.includes('pill')) {
    return "Let me help you remember, Ramesh. Your morning medicine (the white tablet) is taken at 8 AM with water. Your evening medicine (the blue tablet) is taken at 8 PM after dinner. If you're unsure whether you've taken it, it's always safest to ask Priya."
  }
  if (lower.includes('priya') || lower.includes('daughter')) {
    return "Priya is your daughter. She lives in Mumbai and calls you every evening at 6 PM. She loves you very much and checks on you every day. She is also a doctor!"
  }
  if (lower.includes('arjun') || lower.includes('grandson')) {
    return "Arjun is your grandson and Priya's son. He is 12 years old and loves cricket. He visits you every Sunday along with his little sister Diya. He loves spending time with you!"
  }
  if (lower.includes('day') || lower.includes('date') || lower.includes('today')) {
    const now = new Date()
    return `Today is ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. The time is ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Everything is fine, Ramesh.`
  }
  if (lower.includes('lost') || lower.includes('confused') || lower.includes('where am i')) {
    return "Don't worry at all, Ramesh. You are safe at home. If you ever feel lost outside, press the big red 'I AM LOST' button and your family will come to help you immediately. You are loved and safe."
  }
  
  return "I am here with you. You are safe and everything is alright. Could you tell me a little more about what you'd like to know? I'm Raphael, your AI companion, and I'm here to help."
}

function generateMockEmbedding(text: string): number[] {
  // Simple deterministic mock — creates a 768-dim vector based on character codes
  const embedding = new Array(768).fill(0)
  for (let i = 0; i < text.length; i++) {
    embedding[i % 768] += text.charCodeAt(i) / 1000
  }
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map((val) => (magnitude > 0 ? val / magnitude : 0))
}
