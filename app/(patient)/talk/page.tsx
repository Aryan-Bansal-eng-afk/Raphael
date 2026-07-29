'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSpeech } from '@/hooks/useSpeech'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const suggestions = [
  "What did I do yesterday?",
  "Who is Priya?",
  "Did I take my medicine today?",
  "What time is it? What day is it?",
  "Tell me about my family",
  "I feel confused. Can you help me?",
]

export default function TalkPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm Raphael, your personal AI companion. I'm here to help you remember things, tell you about your loved ones, and keep you company. What would you like to talk about today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { speak: speakVoice, stop } = useSpeech()

  const speak = useCallback((text: string) => {
    setSpeaking(true)
    speakVoice(text, { onEnd: () => setSpeaking(false) })
  }, [speakVoice])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Auto-speak welcome message — cancel timer if user navigates away first
    const timer = setTimeout(() => speak(messages[0].content), 1000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      const reply = data.response || "I'm here with you. Let me help you in any way I can."

      const assistantMsg: Message = { role: 'assistant', content: reply, timestamp: new Date() }
      setMessages(prev => [...prev, assistantMsg])
      speak(reply)
    } catch {
      const errorMsg = "I'm here with you. Let me help you — could you ask me again?"
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, timestamp: new Date() }])
      speak(errorMsg)
    }
    setLoading(false)
  }

  function startVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-IN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      setRecording(true)

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        setRecording(false)
        sendMessage(transcript)
      }
      recognition.onerror = () => setRecording(false)
      recognition.onend = () => setRecording(false)
      recognition.start()
    } else {
      alert('Voice input is not supported in your browser. Please type your question.')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 py-5 text-center animate-fade-in" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="text-3xl">✨</span>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Talk to Raphael</h1>
        </div>
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
          I&apos;m here to help you remember and keep you company
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div
              className="max-w-xs rounded-3xl px-6 py-4 text-xl leading-relaxed"
              style={{
                background: msg.role === 'user' ? 'var(--coral)' : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--navy)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                maxWidth: '85%',
              }}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-bold" style={{ color: 'var(--coral)' }}>Raphael ✨</span>
                </div>
              )}
              <p>{msg.content}</p>
              {msg.role === 'assistant' && (
                <button
                  className="mt-3 text-sm font-semibold px-3 py-1 rounded-xl"
                  style={{ background: 'var(--warm-gray)', color: 'var(--navy)' }}
                  onClick={() => speak(msg.content)}
                >
                  🔊 Read again
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="px-6 py-4 rounded-3xl"
              style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse-soft" style={{ background: 'var(--coral)' }} />
                <div className="w-2 h-2 rounded-full animate-pulse-soft" style={{ background: 'var(--coral)', animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full animate-pulse-soft" style={{ background: 'var(--coral)', animationDelay: '0.4s' }} />
                <span className="text-lg ml-2" style={{ color: 'var(--text-muted)' }}>Raphael is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 2 && (
        <div className="px-4 pb-3">
          <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} className="text-base px-4 py-2 rounded-xl font-medium transition-all"
                style={{ background: 'white', color: 'var(--navy)', border: '2px solid var(--border)' }}
                onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3" style={{ background: 'white', borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-3">
          <input
            id="chat-input"
            type="text"
            className="input-field flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Type your question here..."
            disabled={loading}
          />
          {/* Voice button */}
          <button
            id="voice-input-btn"
            className="flex items-center justify-center rounded-2xl font-bold transition-all"
            style={{
              width: 64, height: 60, minWidth: 64, flexShrink: 0,
              background: recording ? '#DC2626' : 'var(--coral)',
              color: 'white',
              fontSize: 28,
            }}
            onClick={startVoiceInput}
            disabled={loading}
          >
            {recording ? <div className="recording-dot" style={{ background: 'white', width: 16, height: 16 }} /> : '🎤'}
          </button>
          {/* Send button */}
          <button
            id="send-message-btn"
            className="flex items-center justify-center rounded-2xl font-bold transition-all"
            style={{
              width: 64, height: 60, minWidth: 64, flexShrink: 0,
              background: 'var(--navy)', color: 'white', fontSize: 24,
            }}
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            {loading ? <div className="spinner" /> : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
