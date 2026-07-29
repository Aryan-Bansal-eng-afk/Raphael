'use client'

import { useEffect, useState } from 'react'

interface LostEvent {
  id: string
  triggeredAt: string
  latitude: number | null
  longitude: number | null
  address: string | null
  notifiedGuardians: string[]
  resolvedAt: string | null
  resolvedBy: string | null
}

export default function GuardianAlertsPage() {
  const [events, setEvents] = useState<LostEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/lost')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function resolve(id: string) {
    setResolvingId(id)
    const res = await fetch(`/api/lost/${id}`, { method: 'PATCH' })
    const data = await res.json()
    if (data.event) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, resolvedAt: data.event.resolvedAt, resolvedBy: data.event.resolvedBy } : e))
    }
    setResolvingId(null)
  }

  const activeEvents = events.filter(e => !e.resolvedAt)
  const resolvedEvents = events.filter(e => e.resolvedAt)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-float">🆘</div>
          <p style={{ color: '#6B7280', fontSize: 18 }}>Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#1A2744' }}>LOST Mode Alerts 🆘</h1>
        <p style={{ color: '#6B7280' }}>All emergency events triggered by your patient</p>
      </div>

      {/* Active Alerts */}
      {activeEvents.length > 0 && (
        <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#991B1B' }}>
            <span className="animate-pulse-soft">🚨</span> Active Emergencies ({activeEvents.length})
          </h2>
          <div className="flex flex-col gap-4">
            {activeEvents.map(event => (
              <div key={event.id} className="p-5 rounded-2xl border-2 animate-fade-in"
                style={{ background: '#FEF2F2', borderColor: '#F87171' }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-lg font-bold mb-1" style={{ color: '#991B1B' }}>
                      🆘 LOST — {new Date(event.triggeredAt).toLocaleString('en-IN')}
                    </p>
                    {event.address && (
                      <p className="text-base" style={{ color: '#DC2626' }}>📍 {event.address}</p>
                    )}
                    {event.latitude && event.longitude && (
                      <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                        GPS: {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <button id={`resolve-event-${event.id}`} onClick={() => resolve(event.id)}
                    className="px-5 py-3 rounded-xl font-bold text-base flex-shrink-0"
                    style={{ background: '#22C55E', color: 'white' }}
                    disabled={resolvingId === event.id}>
                    {resolvingId === event.id ? 'Resolving...' : '✅ I Found Them'}
                  </button>
                </div>

                {/* Map Link */}
                {event.latitude && event.longitude && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}&zoom=16`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold"
                    style={{ background: '#1A2744', color: 'white' }}
                  >
                    🗺️ Open Location on Map
                  </a>
                )}

                {event.notifiedGuardians.length > 0 && (
                  <p className="text-sm mt-3" style={{ color: '#6B7280' }}>
                    Notified: {event.notifiedGuardians.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Active Alerts */}
      {activeEvents.length === 0 && (
        <div className="card text-center py-12 mb-6 animate-fade-in" style={{ background: '#F0FFF4', border: '1px solid #6EE7B7' }}>
          <div className="text-6xl mb-4">✅</div>
          <p className="text-2xl font-semibold mb-2" style={{ color: '#065F46' }}>All clear!</p>
          <p style={{ color: '#6B7280', fontSize: 16 }}>No active LOST events. Your patient is safe.</p>
        </div>
      )}

      {/* Resolved Events History */}
      {resolvedEvents.length > 0 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1A2744' }}>
            📋 Resolved History ({resolvedEvents.length})
          </h2>
          <div className="flex flex-col gap-3">
            {resolvedEvents.map(event => (
              <div key={event.id} className="card"
                style={{ opacity: 0.8 }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold" style={{ color: '#1A2744' }}>
                      LOST event — {new Date(event.triggeredAt).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#22C55E' }}>
                      ✅ Resolved by {event.resolvedBy} at {event.resolvedAt ? new Date(event.resolvedAt).toLocaleTimeString('en-IN') : 'unknown'}
                    </p>
                  </div>
                  {event.latitude && event.longitude && (
                    <a href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}&zoom=16`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-sm px-3 py-2 rounded-lg font-semibold flex-shrink-0"
                      style={{ background: '#EDE9FE', color: '#5B21B6' }}>
                      🗺️ Map
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
