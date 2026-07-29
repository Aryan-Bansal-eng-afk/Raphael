'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'patient' | 'guardian'>('guardian')
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    preferredName: '', diagnosis: '', dateOfBirth: '',
    relationshipLabel: '', patientEmail: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        phone: form.phone,
        preferredName: form.preferredName,
        diagnosis: form.diagnosis,
        dateOfBirth: form.dateOfBirth,
        relationshipLabel: form.relationshipLabel,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Registration failed')
      setLoading(false)
      return
    }

    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">✨</div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Raphael</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Join Raphael as a patient or guardian</p>
        </div>

        <div className="card">
          {/* Role Selector */}
          <div className="flex gap-3 mb-6 p-1 rounded-2xl" style={{ background: 'var(--warm-gray)' }}>
            {(['guardian', 'patient'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 py-3 rounded-xl font-semibold text-lg transition-all"
                style={{
                  background: role === r ? 'white' : 'transparent',
                  color: role === r ? 'var(--navy)' : 'var(--text-muted)',
                  boxShadow: role === r ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {r === 'patient' ? '🏥 Patient' : '🛡️ Guardian'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl text-base font-medium"
              style={{ background: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="input-label">Full Name</label>
              <input className="input-field" value={form.name}
                onChange={e => update('name', e.target.value)} placeholder="Your full name" required />
            </div>

            <div>
              <label className="input-label">Email Address</label>
              <input type="email" className="input-field" value={form.email}
                onChange={e => update('email', e.target.value)} placeholder="your@email.com" required />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input type="password" className="input-field" value={form.password}
                onChange={e => update('password', e.target.value)} placeholder="Create a password" required />
            </div>

            <div>
              <label className="input-label">Phone Number (optional)</label>
              <input type="tel" className="input-field" value={form.phone}
                onChange={e => update('phone', e.target.value)} placeholder="+91-9876543210" />
            </div>

            {role === 'patient' && (
              <>
                <div>
                  <label className="input-label">Preferred Name (what should AI call you?)</label>
                  <input className="input-field" value={form.preferredName}
                    onChange={e => update('preferredName', e.target.value)} placeholder="E.g. Ramesh" />
                </div>
                <div>
                  <label className="input-label">Date of Birth</label>
                  <input type="date" className="input-field" value={form.dateOfBirth}
                    onChange={e => update('dateOfBirth', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Diagnosis (optional)</label>
                  <input className="input-field" value={form.diagnosis}
                    onChange={e => update('diagnosis', e.target.value)}
                    placeholder="E.g. Alzheimer's Disease (Early Stage)" />
                </div>
              </>
            )}

            {role === 'guardian' && (
              <div>
                <label className="input-label">Your Relationship to Patient</label>
                <input className="input-field" value={form.relationshipLabel}
                  onChange={e => update('relationshipLabel', e.target.value)}
                  placeholder="E.g. Daughter, Son, Caregiver" />
              </div>
            )}

            <button
              id="register-btn"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? <><div className="spinner" /> Creating account...</> : '✨ Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-base" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold" style={{ color: 'var(--coral)' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
