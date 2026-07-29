'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSpeech } from '@/hooks/useSpeech'

interface Task {
  id: string
  title: string
  description: string | null
  scheduledTime: string
  category: string
  difficulty: string
  isCompleted: boolean
  recurrence: string
}

const categoryEmoji: Record<string, string> = {
  medicine: '💊', family: '👨‍👩‍👧', appointment: '🏥',
  exercise: '🚶', meal: '🍽️', other: '📌',
}

const moodEmoji: Record<string, string> = {
  happy: '😊', calm: '😌', sad: '😢', anxious: '😰', confused: '😕',
}

export default function PatientHome() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [briefing, setBriefing] = useState('')
  const [loading, setLoading] = useState(true)
  const [showLost, setShowLost] = useState(false)
  const [lostConfirm, setLostConfirm] = useState(false)
  const [lostActive, setLostActive] = useState(false)
  const [lostLocation, setLostLocation] = useState<{lat: number, lng: number} | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const { speak: speakVoice, stop } = useSpeech()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable speak wrapper that manages local speaking state
  const speak = useCallback((text: string) => {
    setSpeaking(true)
    speakVoice(text, { onEnd: () => setSpeaking(false) })
  }, [speakVoice])

  // Clear any pending auto-speak timer when the user navigates away
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tasks?briefing=true')
        const data = await res.json()
        setTasks(data.tasks || [])
        setBriefing(data.briefing || '')
        setLoading(false)
        if (data.briefing) {
          timerRef.current = setTimeout(() => speak(data.briefing), 1000)
        }
      } catch {
        setLoading(false)
      }
    }
    load()
  }, [speak])

  async function completeTask(taskId: string) {
    setCompletingId(taskId)
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: true }),
      })
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true } : t))
      speak('Great job! Well done. You are doing wonderfully today.')
    } catch {
      speak('Sorry, I could not save that. Please try again.')
    }
    setCompletingId(null)
  }

  async function triggerLost() {
    setLostActive(true)
    setLostConfirm(false)

    // Get GPS
    let lat: number | null = null
    let lng: number | null = null
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
      setLostLocation({ lat, lng })
    } catch {
      console.log('Could not get GPS location')
    }

    // Notify guardians via API
    try {
      await fetch('/api/lost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      })
    } catch {
      console.error('Failed to notify guardians')
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Memory: LOST Mode Active', {
        body: 'Your family has been notified and is on their way.',
        icon: '/favicon.ico',
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission()
    }

    speak("Don't worry. You are safe. Your family has been notified and someone is coming to help you. Please stay where you are.")
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const pendingTasks = tasks.filter(t => !t.isCompleted)
  const doneTasks = tasks.filter(t => t.isCompleted)

  if (lostActive) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-center gradient-morning">
        <div className="animate-float text-8xl mb-6">🙏</div>
        <h1 className="text-5xl font-bold text-white mb-4">Help Is Coming</h1>
        <p className="text-2xl text-white mb-8 leading-relaxed max-w-sm" style={{ opacity: 0.9 }}>
          Don&apos;t worry. You are safe. Your family has been notified and is coming to help you.
        </p>

        {lostLocation && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${lostLocation.lat}&mlon=${lostLocation.lng}&zoom=15`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 px-6 py-3 rounded-xl font-semibold text-lg"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}
          >
            📍 View Your Location on Map
          </a>
        )}

        <button
          className="btn-primary"
          style={{ maxWidth: 320, fontSize: 22, padding: '20px 32px' }}
          onClick={() => speak("Don't worry. You are safe. Your family has been notified and someone is coming to help you.")}
        >
          🔊 Hear This Again
        </button>

        <button
          className="mt-4 text-white text-lg font-medium py-2 px-6 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          onClick={() => setLostActive(false)}
        >
          I am safe now — go back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Morning Greeting */}
      <div className="rounded-3xl p-7 mb-6 text-white gradient-morning animate-fade-in relative overflow-hidden">
        <div className="absolute top-4 right-6 text-5xl opacity-20 animate-float">✨</div>
        <p className="text-lg font-medium mb-1" style={{ opacity: 0.8 }}>
          {timeStr} · {dateStr}
        </p>
        <h1 className="text-4xl font-bold mb-4">Good Morning! ☀️</h1>

        {loading ? (
          <p className="text-xl" style={{ opacity: 0.8 }}>Loading your daily briefing...</p>
        ) : briefing ? (
          <p className="text-xl leading-relaxed" style={{ opacity: 0.95 }}>{briefing}</p>
        ) : (
          <p className="text-xl" style={{ opacity: 0.9 }}>Have a wonderful day!</p>
        )}

        <button
          className="mt-5 flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-lg"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          onClick={() => briefing && speak(briefing)}
        >
          {speaking ? <><div className="recording-dot" style={{ background: 'white' }} /> Speaking...</> : '🔊 Read to me'}
        </button>
      </div>

      {/* LOST Button */}
      <div className="mb-6">
        <div className="lost-btn-wrapper w-full">
          <button
            id="lost-mode-btn"
            className="btn-danger w-full"
            onClick={() => setLostConfirm(true)}
          >
            🆘 I AM LOST / I NEED HELP
          </button>
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <section className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
            📋 To Do Today
          </h2>
          <div className="flex flex-col gap-3">
            {pendingTasks.map(task => (
              <div key={task.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{categoryEmoji[task.category] || '📌'}</span>
                      <span className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>{task.title}</span>
                    </div>
                    {task.description && (
                      <p className="text-lg ml-9" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                    )}
                    <p className="text-lg font-semibold mt-1 ml-9" style={{ color: 'var(--coral)' }}>
                      ⏰ {task.scheduledTime}
                    </p>
                  </div>
                  <button
                    className="btn-success"
                    style={{ width: 'auto', minWidth: 100, padding: '14px 20px', fontSize: '18px' }}
                    onClick={() => completeTask(task.id)}
                    disabled={completingId === task.id}
                    id={`complete-task-${task.id}`}
                  >
                    {completingId === task.id ? <div className="spinner" /> : '✅ Done'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Tasks */}
      {doneTasks.length > 0 && (
        <section className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sage)' }}>
            ✅ Done Today ({doneTasks.length})
          </h2>
          <div className="flex flex-col gap-2">
            {doneTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                style={{ background: '#F0FFF4', border: '1px solid #BBF7D0' }}>
                <span className="text-2xl">{categoryEmoji[task.category] || '📌'}</span>
                <span className="text-xl font-medium line-through" style={{ color: 'var(--sage)' }}>
                  {task.title}
                </span>
                <span className="ml-auto text-2xl">✅</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="animate-fade-in">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/talk', emoji: '💬', label: 'Talk to Raphael', color: '#EDE9FE' },
            { href: '/people', emoji: '👥', label: 'Who is who?', color: '#DBEAFE' },
            { href: '/memories', emoji: '📖', label: 'My Diary', color: '#FEF3C7' },
            { href: '/talk', emoji: '🕐', label: 'What time is it?', color: '#D1FAE5' },
          ].map((item, i) => (
            <Link key={i} href={item.href}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl font-semibold text-lg text-center transition-all"
              style={{ background: item.color, color: 'var(--navy)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <span className="text-4xl">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* LOST Confirmation Modal */}
      {lostConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(26,39,68,0.7)' }}>
          <div className="card w-full max-w-sm text-center animate-fade-in">
            <div className="text-6xl mb-4">🆘</div>
            <h3 className="text-3xl font-bold mb-3" style={{ color: '#DC2626' }}>Are You Lost?</h3>
            <p className="text-xl mb-8 leading-relaxed" style={{ color: 'var(--navy)' }}>
              Press YES and your family will be notified immediately. You are not alone.
            </p>
            <div className="flex flex-col gap-3">
              <button id="confirm-lost-btn" className="btn-danger w-full" onClick={triggerLost}>
                ✅ YES — Notify My Family
              </button>
              <button className="btn-secondary" onClick={() => setLostConfirm(false)}>
                ❌ No, I am okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
