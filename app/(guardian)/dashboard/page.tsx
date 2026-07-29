'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardData {
  patient: { fullName: string; preferredName: string; diagnosis: string | null }
  stats: {
    totalTasks: number; completedToday: number; completionRate: number;
    peopleCount: number; activeLostEvents: number;
  }
  recentDiary: Array<{ id: string; rawText: string; moodLabel: string | null; createdAt: string }>
  activeLostEvents: Array<{ id: string; triggeredAt: string; latitude: number | null; longitude: number | null }>
  moodTrend: Array<{ moodLabel: string | null; createdAt: string }>
}

const moodEmoji: Record<string, string> = {
  happy: '😊', calm: '😌', sad: '😢', anxious: '😰', confused: '😕',
}

const moodColor: Record<string, string> = {
  happy: '#FEF3C7', calm: '#D1FAE5', sad: '#EDE9FE', anxious: '#FEE2E2', confused: '#FEF9C3',
}

export default function GuardianDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/guardian')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-float">📊</div>
          <p className="text-xl" style={{ color: '#6B7280' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔗</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2744' }}>No patient linked yet</h2>
        <p className="text-lg" style={{ color: '#6B7280' }}>
          Please link your account to a patient profile to see their dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Patient Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#1A2744' }}>
          {data.patient.fullName}&apos;s Dashboard
        </h1>
        <p style={{ color: '#6B7280', fontSize: 18 }}>
          {data.patient.diagnosis || 'Memory Care Patient'}
        </p>
      </div>

      {/* LOST MODE ALERT */}
      {data.activeLostEvents.length > 0 && (
        <div className="mb-6 p-5 rounded-2xl animate-fade-in"
          style={{ background: '#FEE2E2', border: '2px solid #F87171' }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl animate-pulse-soft">🆘</span>
            <h2 className="text-2xl font-bold" style={{ color: '#991B1B' }}>
              LOST MODE ACTIVE — {data.activeLostEvents.length} event(s)
            </h2>
          </div>
          <p className="text-lg mb-4" style={{ color: '#DC2626' }}>
            {data.patient.preferredName} has triggered the LOST button. Please respond immediately.
          </p>
          <Link href="/guardian/alerts"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-lg"
            style={{ background: '#DC2626', color: 'white' }}>
            🗺️ View Location & Resolve
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
        {[
          { label: 'Task Completion', value: `${data.stats.completionRate}%`, emoji: '✅', color: '#D1FAE5', textColor: '#065F46' },
          { label: 'Tasks Today', value: `${data.stats.completedToday} / ${data.stats.totalTasks}`, emoji: '📋', color: '#DBEAFE', textColor: '#1E40AF' },
          { label: 'People Registry', value: data.stats.peopleCount, emoji: '👥', color: '#EDE9FE', textColor: '#5B21B6' },
          { label: 'Active Alerts', value: data.stats.activeLostEvents, emoji: '🚨', color: data.stats.activeLostEvents > 0 ? '#FEE2E2' : '#F3F4F6', textColor: data.stats.activeLostEvents > 0 ? '#991B1B' : '#374151' },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background: stat.color }}>
            <div className="text-3xl mb-2">{stat.emoji}</div>
            <div className="text-3xl font-bold mb-1" style={{ color: stat.textColor }}>{stat.value}</div>
            <div className="text-sm font-semibold" style={{ color: stat.textColor, opacity: 0.8 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mood Trend */}
      {data.moodTrend.length > 0 && (
        <div className="card mb-6 animate-fade-in">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1A2744' }}>📈 Recent Mood (Last 7 Days)</h2>
          <div className="flex flex-wrap gap-2">
            {data.moodTrend.map((m, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: moodColor[m.moodLabel || ''] || '#F3F4F6' }}>
                <span className="text-lg">{moodEmoji[m.moodLabel || ''] || '🔘'}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A2744', textTransform: 'capitalize' }}>
                    {m.moodLabel || 'unknown'}
                  </p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    {new Date(m.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Diary Entries */}
      {data.recentDiary.length > 0 && (
        <div className="card animate-fade-in">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1A2744' }}>📖 Recent Diary Entries</h2>
          <div className="flex flex-col gap-3">
            {data.recentDiary.map(entry => (
              <div key={entry.id} className="p-4 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{moodEmoji[entry.moodLabel || ''] || '📝'}</span>
                  <span className="text-sm font-semibold" style={{ color: '#6B7280' }}>
                    {new Date(entry.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <p className="text-base" style={{ color: '#374151' }}>
                  {entry.rawText.slice(0, 150)}{entry.rawText.length > 150 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
