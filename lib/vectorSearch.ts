// Cosine similarity vector search over diary entries stored in SQLite
// Each diary entry has an `embedding` field stored as JSON string of float[]

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  return magnitude === 0 ? 0 : dot / magnitude
}

export interface SearchResult {
  id: string
  text: string
  score: number
  metadata: {
    date: string
    mood?: string | null
    peopleMentioned: string[]
    placesMentioned: string[]
  }
}

export function searchEntries(
  queryEmbedding: number[],
  entries: Array<{
    id: string
    rawText: string
    embedding: string | null
    createdAt: Date
    moodLabel: string | null
    peopleMentioned: string
    placesMentioned: string
  }>,
  topK: number = 5,
  threshold: number = 0.3
): SearchResult[] {
  const results: SearchResult[] = []

  for (const entry of entries) {
    if (!entry.embedding) continue

    try {
      const entryEmbedding: number[] = JSON.parse(entry.embedding)
      const score = cosineSimilarity(queryEmbedding, entryEmbedding)

      if (score >= threshold) {
        results.push({
          id: entry.id,
          text: entry.rawText,
          score,
          metadata: {
            date: entry.createdAt.toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            mood: entry.moodLabel,
            peopleMentioned: JSON.parse(entry.peopleMentioned || '[]'),
            placesMentioned: JSON.parse(entry.placesMentioned || '[]'),
          },
        })
      }
    } catch {
      // Skip entries with invalid embeddings
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topK)
}
