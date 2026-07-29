'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

// Stops any ongoing TTS whenever the user navigates to a different page
function SpeechStopper() {
  const pathname = usePathname()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }
  }, [pathname])
  return null
}

const navItems = [
  { href: '/home', emoji: '🏠', label: 'Home' },
  { href: '/people', emoji: '👥', label: 'People' },
  { href: '/memories', emoji: '📖', label: 'Diary' },
  { href: '/talk', emoji: '✨', label: 'Talk to Raphael' },
]

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showLogout, setShowLogout] = useState(false)

  return (
    <div className="patient-body min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Global: cancels TTS on every page navigation */}
      <SpeechStopper />
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-40"
        style={{ background: 'white', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>Raphael</span>
        </div>
        <button
          id="logout-btn-patient"
          onClick={() => setShowLogout(true)}
          className="text-lg font-medium px-4 py-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--warm-gray)' }}
        >
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-32">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'white',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                className="flex-1 flex flex-col items-center py-4 gap-1 transition-all"
                style={{
                  color: active ? 'var(--coral)' : 'var(--text-muted)',
                  borderTop: active ? '3px solid var(--coral)' : '3px solid transparent',
                }}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-semibold leading-none"
                  style={{ fontSize: '13px' }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Logout Confirmation */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(26,39,68,0.6)' }}>
          <div className="card w-full max-w-sm text-center animate-fade-in">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--navy)' }}>Sign Out?</h3>
            <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
              You can always sign back in to continue.
            </p>
            <div className="flex flex-col gap-3">
              <button className="btn-primary" onClick={() => signOut({ callbackUrl: '/login' })}>
                Yes, Sign Out
              </button>
              <button className="btn-secondary" onClick={() => setShowLogout(false)}>
                Stay Here
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
