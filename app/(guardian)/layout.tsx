'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', emoji: '📊', label: 'Overview' },
  { href: '/guardian/tasks', emoji: '✅', label: 'Tasks' },
  { href: '/guardian/people', emoji: '👥', label: 'People' },
  { href: '/guardian/alerts', emoji: '🆘', label: 'Alerts' },
]

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FC' }}>
      {/* Top Nav */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'white', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <div>
            <span className="text-2xl font-bold" style={{ color: '#1A2744' }}>Raphael</span>
            <span className="ml-2 text-sm font-semibold px-2 py-0.5 rounded-md"
              style={{ background: '#EDE9FE', color: '#5B21B6' }}>Guardian</span>
          </div>
        </div>
        <button
          id="guardian-logout-btn"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          Sign Out
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 p-4 gap-1 sticky top-16 h-[calc(100vh-64px)]"
          style={{ background: 'white', borderRight: '1px solid #E5E7EB' }}>
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                id={`guardian-nav-${item.label.toLowerCase()}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all"
                style={{
                  background: active ? '#EDE9FE' : 'transparent',
                  color: active ? '#5B21B6' : '#6B7280',
                }}>
                <span className="text-xl">{item.emoji}</span>
                {item.label}
              </Link>
            )
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: 'white', borderTop: '1px solid #E5E7EB' }}>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold"
              style={{ color: active ? '#5B21B6' : '#9CA3AF', borderTop: active ? '2px solid #5B21B6' : '2px solid transparent' }}>
              <span className="text-2xl">{item.emoji}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
