'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
    } else {
      // Redirect based on role will be handled by root page
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">✨</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--navy)' }}>Raphael</h1>
          <p className="text-xl" style={{ color: 'var(--text-muted)' }}>
            Your compassionate AI companion
          </p>
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>Welcome back</h2>

          {error && (
            <div className="mb-4 p-4 rounded-xl text-base font-medium"
              style={{ background: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="input-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? <><div className="spinner" /> Signing in...</> : '🔐 Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-center text-base" style={{ color: 'var(--text-muted)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold" style={{ color: 'var(--coral)' }}>
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 p-4 rounded-xl text-center"
          style={{ background: '#EDE9FE', border: '1px solid #C4B5FD' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#5B21B6' }}>🎯 Demo Accounts</p>
          <p className="text-sm" style={{ color: '#6D28D9' }}>
            Patient: <strong>patient@memory.app</strong> / patient123
          </p>
          <p className="text-sm" style={{ color: '#6D28D9' }}>
            Guardian: <strong>guardian@memory.app</strong> / guardian123
          </p>
        </div>
      </div>
    </div>
  )
}
