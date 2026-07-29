'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSpeech } from '@/hooks/useSpeech'

interface DiaryEntry {
  id: string
  rawText: string
  moodLabel: string | null
  peopleMentioned: string
  placesMentioned: string
  audioUrl: string | null
  createdAt: string
}

const moodEmoji: Record<string, string> = {
  happy: '😊', calm: '😌', sad: '😢', anxious: '😰', confused: '😕',
}

type InputMode = 'idle' | 'voice' | 'text'

export default function MemoriesPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [inputMode, setInputMode] = useState<InputMode>('idle')
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [typedText, setTypedText] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const { speak: speakVoice, stop } = useSpeech()

  const speak = useCallback((text: string, id: string) => {
    setSpeaking(id)
    speakVoice(text, { onEnd: () => setSpeaking(null) })
  }, [speakVoice])

  useEffect(() => {
    fetch('/api/diary')
      .then(r => r.json())
      .then(d => { setEntries(d.entries || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ─── Voice Recording ─────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => handleRecordingStop(stream)
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch {
      // Fallback to Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SR()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = 'en-IN'
        let text = ''
        recognition.onresult = (e: any) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            text += e.results[i][0].transcript + ' '
          }
        }
        recognition.onend = () => {
          setRecording(false)
          if (text.trim()) { setTranscript(text.trim()); setShowConfirm(true) }
        }
        recognition.start()
        setRecording(true)
        ;(window as any)._recognition = recognition
      }
    }
  }

  function stopRecording() {
    if ((window as any)._recognition) { (window as any)._recognition.stop(); return }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  async function handleRecordingStop(stream: MediaStream) {
    stream.getTracks().forEach(t => t.stop())
    setProcessing(true)
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = await res.json()
      setTranscript(data.transcript || '')
      setShowConfirm(true)
    } catch {
      setTranscript('')
    }
    setProcessing(false)
  }

  // ─── Text Input Submit ────────────────────────────────────────
  function submitTextEntry() {
    if (!typedText.trim()) return
    setTranscript(typedText.trim())
    setShowConfirm(true)
    setInputMode('idle')
  }

  // ─── Save Entry ───────────────────────────────────────────────
  async function saveEntry() {
    if (!transcript.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      })
      const data = await res.json()
      if (data.entry) {
        setEntries(prev => [data.entry, ...prev])
        setSavedOk(true)
        setShowConfirm(false)
        setTranscript('')
        setTypedText('')
        setInputMode('idle')
        speak("Your memory has been saved! Wonderful. I will remember this for you always.", 'save-confirm')
        setTimeout(() => setSavedOk(false), 4000)
      }
    } catch {
      alert('Could not save the entry. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--navy)' }}>My Diary 📖</h1>
        <p className="text-xl" style={{ color: 'var(--text-muted)' }}>
          Record your day — by voice or by writing
        </p>
      </div>

      {/* Saved Banner */}
      {savedOk && (
        <div className="mb-5 p-4 rounded-2xl text-center animate-fade-in"
          style={{ background: '#D1FAE5', border: '1px solid #6EE7B7' }}>
          <p className="text-xl font-semibold" style={{ color: '#065F46' }}>
            ✅ Memory saved! Raphael will remember this.
          </p>
        </div>
      )}

      {/* Input Mode Selector */}
      {inputMode === 'idle' && (
        <div className="card mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-5 text-center" style={{ color: 'var(--navy)' }}>
            How would you like to add a memory?
          </h2>
          <div className="flex flex-col gap-3">
            <button
              id="start-voice-mode-btn"
              className="btn-primary"
              onClick={() => setInputMode('voice')}
            >
              🎙️ Speak — I will talk out loud
            </button>
            <button
              id="start-text-mode-btn"
              className="btn-success"
              onClick={() => setInputMode('text')}
            >
              ✍️ Write — I will type my memory
            </button>
          </div>
        </div>
      )}

      {/* Voice Recording UI */}
      {inputMode === 'voice' && (
        <div className="card mb-6 p-6 text-center animate-fade-in">
          <div className={`text-6xl mb-3 ${recording ? 'animate-pulse-soft' : 'animate-float'}`}>
            {recording ? '🔴' : '🎙️'}
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
            {recording ? 'Listening... Speak freely' : 'Voice Recording'}
          </h2>
          <p className="text-lg mb-5" style={{ color: 'var(--text-muted)' }}>
            {recording
              ? 'Tell me about your day. Press Stop when you are done.'
              : 'Press the button below to start talking.'}
          </p>
          {processing ? (
            <div className="flex items-center justify-center gap-3">
              <div className="spinner" style={{ borderColor: 'rgba(26,39,68,0.2)', borderTopColor: 'var(--navy)' }} />
              <span className="text-xl" style={{ color: 'var(--text-muted)' }}>Listening to your recording...</span>
            </div>
          ) : recording ? (
            <button id="stop-recording-btn" className="btn-danger" onClick={stopRecording} style={{ maxWidth: 280, margin: 'auto' }}>
              <div className="recording-dot" style={{ background: 'white' }} /> Stop Recording
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button id="start-recording-btn" className="btn-primary" onClick={startRecording} style={{ maxWidth: 280, margin: 'auto' }}>
                🎙️ Start Recording
              </button>
              <button className="btn-secondary" onClick={() => setInputMode('idle')} style={{ maxWidth: 280, margin: 'auto' }}>
                ← Go back
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text Input UI */}
      {inputMode === 'text' && (
        <div className="card mb-6 animate-fade-in">
          <div className="text-5xl text-center mb-3 animate-float">✍️</div>
          <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--navy)' }}>
            Write Your Memory
          </h2>
          <p className="text-lg mb-5 text-center" style={{ color: 'var(--text-muted)' }}>
            What happened today? Who did you meet? How are you feeling?
          </p>

          <textarea
            id="diary-text-input"
            className="input-field"
            style={{ minHeight: 160, resize: 'vertical', fontSize: '20px', lineHeight: 1.6 }}
            value={typedText}
            onChange={e => setTypedText(e.target.value)}
            placeholder="Today I had a good morning. Priya called me. We talked about..."
            autoFocus
          />

          <div className="flex flex-col gap-3 mt-4">
            <button
              id="submit-text-diary-btn"
              className="btn-success"
              onClick={submitTextEntry}
              disabled={!typedText.trim()}
            >
              ✅ Save This Memory
            </button>
            <button className="btn-secondary" onClick={() => { setInputMode('idle'); setTypedText('') }}>
              ← Go back
            </button>
          </div>
        </div>
      )}

      {/* Confirm Transcript Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,39,68,0.7)' }}>
          <div className="card w-full max-w-lg animate-fade-in">
            <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
              ✍️ Does this look right?
            </h3>
            <div className="p-4 rounded-xl mb-5 text-xl leading-relaxed"
              style={{ background: 'var(--warm-gray)', color: 'var(--navy)', minHeight: 80 }}>
              {transcript || 'No text was captured. Please try again.'}
            </div>
            <p className="text-base mb-5" style={{ color: 'var(--text-muted)' }}>
              You can edit the text above if something is wrong. Raphael will save this as your memory.
            </p>
            <textarea
              className="input-field mb-4"
              style={{ fontSize: '18px', lineHeight: 1.6, minHeight: 100 }}
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
            />
            <div className="flex flex-col gap-3">
              <button id="save-diary-btn" className="btn-success" onClick={saveEntry} disabled={saving || !transcript}>
                {saving ? <><div className="spinner" /> Saving...</> : '💾 Yes, Save This Memory'}
              </button>
              <button className="btn-secondary" onClick={() => { setShowConfirm(false); setTranscript('') }}>
                ✏️ Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diary Entries */}
      {loading ? (
        <div className="text-center py-8">
          <div className="spinner mx-auto mb-3" style={{ borderColor: 'rgba(26,39,68,0.2)', borderTopColor: 'var(--navy)', width: 36, height: 36 }} />
          <p className="text-xl" style={{ color: 'var(--text-muted)' }}>Loading your memories...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-2xl font-semibold mb-2" style={{ color: 'var(--navy)' }}>
            No memories yet
          </p>
          <p className="text-xl" style={{ color: 'var(--text-muted)' }}>
            Add your first memory above — by voice or by writing!
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>Your Memories</h2>
          <div className="flex flex-col gap-4">
            {entries.map(entry => {
              const date = new Date(entry.createdAt)
              const dateStr = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              const people: string[] = JSON.parse(entry.peopleMentioned || '[]')
              const isExpanded = expandedId === entry.id
              const isSpeak = speaking === entry.id

              return (
                <div key={entry.id} className="card animate-fade-in">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
                      {entry.moodLabel && (
                        <span className={`mood-badge mood-${entry.moodLabel}`}>
                          {moodEmoji[entry.moodLabel] || ''} {entry.moodLabel}
                        </span>
                      )}
                    </div>
                    <button
                      id={`speak-entry-${entry.id}`}
                      className="px-4 py-2 rounded-xl font-semibold text-base transition-all flex-shrink-0"
                      style={{
                        background: isSpeak ? 'var(--coral)' : 'var(--warm-gray)',
                        color: isSpeak ? 'white' : 'var(--navy)',
                      }}
                      onClick={() => isSpeak
                        ? (stop(), setSpeaking(null))
                        : speak(entry.rawText, entry.id)}>
                      {isSpeak ? '⏹ Stop' : '🔊 Read'}
                    </button>
                  </div>

                  <p className="text-xl leading-relaxed mb-3" style={{ color: 'var(--navy)' }}>
                    {isExpanded ? entry.rawText : entry.rawText.slice(0, 120) + (entry.rawText.length > 120 ? '...' : '')}
                  </p>

                  {entry.rawText.length > 120 && (
                    <button className="text-base font-semibold" style={{ color: 'var(--coral)' }}
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  {people.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {people.map(p => (
                        <span key={p} className="text-sm px-3 py-1 rounded-xl font-medium"
                          style={{ background: '#DBEAFE', color: '#1E40AF' }}>
                          👤 {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
