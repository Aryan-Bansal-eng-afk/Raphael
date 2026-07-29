'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    } else {
      const role = (session.user as any)?.role
      if (role === 'patient') router.push('/home')
      else if (role === 'guardian') router.push('/dashboard')
      else router.push('/login')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-4">✨</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>Raphael</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Your compassionate AI companion</p>
        <div className="mt-6 flex justify-center">
          <div className="spinner" style={{ borderColor: 'rgba(26,39,68,0.2)', borderTopColor: 'var(--navy)' }} />
        </div>
      </div>
    </div>
  )
}
