'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSpeech } from '@/hooks/useSpeech'

interface Person {
  id: string
  name: string
  nickname: string | null
  relationshipLabel: string
  phone: string | null
  address: string | null
  photoUrl: string | null
  keyFacts: string[]
}

const relationshipColors: Record<string, string> = {
  Daughter: '#DBEAFE', Son: '#DBEAFE', Grandson: '#D1FAE5', Granddaughter: '#FCE7F3',
  Doctor: '#EDE9FE', Caregiver: '#FEF3C7', Friend: '#FEF9C3', Wife: '#FCE7F3',
  Husband: '#DBEAFE', Sister: '#FCE7F3', Brother: '#D1FAE5', Mother: '#FEF3C7',
  Father: '#DBEAFE', Other: '#F3F4F6',
}

const relationships = [
  'Daughter', 'Son', 'Grandson', 'Granddaughter', 'Wife', 'Husband',
  'Sister', 'Brother', 'Mother', 'Father', 'Doctor', 'Caregiver', 'Friend', 'Other',
]

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [description, setDescription] = useState('')
  const [descLoading, setDescLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  // Add contact state
  const [showAddContact, setShowAddContact] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '', nickname: '', relationship: 'Friend', phone: '', address: '', fact1: '', fact2: '',
  })
  const [addSuccess, setAddSuccess] = useState(false)

  const { speak: speakVoice, stop } = useSpeech()

  const speak = useCallback((text: string) => {
    setSpeaking(true)
    speakVoice(text, { onEnd: () => setSpeaking(false) })
  }, [speakVoice])

  useEffect(() => {
    fetch('/api/people')
      .then(r => r.json())
      .then(d => { setPeople(d.people || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handlePersonTap(person: Person) {
    setSelectedPerson(person)
    setDescLoading(true)
    setDescription('')
    try {
      const res = await fetch(`/api/people/${person.id}`)
      const data = await res.json()
      setDescription(data.description || '')
      setDescLoading(false)
      if (data.description) setTimeout(() => speak(data.description), 500)
    } catch {
      const fallback = `${person.name} is your ${person.relationshipLabel}. ${person.keyFacts.slice(0, 2).join('. ')}.`
      setDescription(fallback)
      setDescLoading(false)
      speak(fallback)
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const facts = [addForm.fact1, addForm.fact2].filter(f => f.trim())
    const fd = new FormData()
    fd.append('name', addForm.name)
    fd.append('nickname', addForm.nickname)
    fd.append('relationshipLabel', addForm.relationship)
    fd.append('phone', addForm.phone)
    fd.append('address', addForm.address)
    fd.append('keyFacts', JSON.stringify(facts))

    try {
      const res = await fetch('/api/people', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.person) {
        setPeople(prev => [data.person, ...prev])
        setAddSuccess(true)
        setShowAddContact(false)
        setAddForm({ name: '', nickname: '', relationship: 'Friend', phone: '', address: '', fact1: '', fact2: '' })
        speak(`Great! I have added ${addForm.name} to your contacts. You can tap their card anytime to hear about them.`)
        setTimeout(() => setAddSuccess(false), 4000)
      }
    } catch {
      speak('Sorry, I could not save this contact. Please try again.')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="text-5xl animate-float">👥</div>
        <p className="text-2xl font-medium" style={{ color: 'var(--text-muted)' }}>Loading your loved ones...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--navy)' }}>People You Know 💝</h1>
        <p className="text-xl" style={{ color: 'var(--text-muted)' }}>
          Tap on anyone to hear who they are
        </p>
      </div>

      {/* Add Success Banner */}
      {addSuccess && (
        <div className="mb-5 p-4 rounded-2xl text-center animate-fade-in"
          style={{ background: '#D1FAE5', border: '1px solid #6EE7B7' }}>
          <p className="text-xl font-semibold" style={{ color: '#065F46' }}>
            ✅ Contact added!
          </p>
        </div>
      )}

      {/* Add Contact Button */}
      <div className="mb-6 animate-fade-in">
        <button
          id="add-contact-patient-btn"
          className="btn-success"
          onClick={() => setShowAddContact(true)}
        >
          ➕ Add Someone I Know
        </button>
      </div>

      {/* People Grid */}
      {people.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🤗</div>
          <p className="text-2xl font-semibold mb-2" style={{ color: 'var(--navy)' }}>
            No contacts yet
          </p>
          <p className="text-xl" style={{ color: 'var(--text-muted)' }}>
            Tap the green button above to add someone you know!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          {people.map(person => {
            const bgColor = relationshipColors[person.relationshipLabel] || '#F3F4F6'
            return (
              <button
                key={person.id}
                id={`person-card-${person.id}`}
                className="card text-left p-5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{ background: bgColor, border: '2px solid transparent' }}
                onClick={() => handlePersonTap(person)}
              >
                <div className="w-20 h-20 rounded-2xl mb-3 overflow-hidden flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(255,255,255,0.7)' }}>
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">
                      {person.relationshipLabel === 'Doctor' ? '👨‍⚕️' :
                       ['Daughter', 'Granddaughter', 'Wife', 'Mother', 'Sister'].includes(person.relationshipLabel) ? '👩' :
                       person.relationshipLabel === 'Friend' ? '🤝' : '👨'}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-center mb-1" style={{ color: 'var(--navy)' }}>
                  {person.name}
                </h3>
                <p className="text-base font-semibold text-center" style={{ color: 'var(--coral)' }}>
                  {person.relationshipLabel}
                </p>
                {person.nickname && (
                  <p className="text-base text-center mt-1" style={{ color: 'var(--text-muted)' }}>
                    &ldquo;{person.nickname}&rdquo;
                  </p>
                )}
                <p className="text-sm text-center mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  🔊 Tap to learn more
                </p>
              </button>
            )
          })}
        </div>
      )}

      {/* Person Detail Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(26,39,68,0.6)' }}
          onClick={() => { setSelectedPerson(null); stop() }}>
          <div
            className="card w-full max-w-lg animate-fade-in"
            style={{ marginBottom: '100px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="w-28 h-28 rounded-3xl mb-4 overflow-hidden flex items-center justify-center mx-auto"
                style={{ background: 'var(--warm-gray)' }}>
                {selectedPerson.photoUrl ? (
                  <img src={selectedPerson.photoUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">
                    {selectedPerson.relationshipLabel === 'Doctor' ? '👨‍⚕️' :
                     ['Daughter', 'Granddaughter', 'Wife', 'Mother', 'Sister'].includes(selectedPerson.relationshipLabel) ? '👩' :
                     selectedPerson.relationshipLabel === 'Friend' ? '🤝' : '👨'}
                  </span>
                )}
              </div>
              <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>{selectedPerson.name}</h3>
              <span className="inline-block px-4 py-1 rounded-xl font-semibold text-lg"
                style={{ background: 'var(--coral)', color: 'white' }}>
                {selectedPerson.relationshipLabel}
              </span>
            </div>

            {descLoading ? (
              <div className="text-center py-4">
                <div className="spinner mx-auto" style={{ borderColor: 'rgba(26,39,68,0.2)', borderTopColor: 'var(--navy)' }} />
                <p className="text-lg mt-3" style={{ color: 'var(--text-muted)' }}>Raphael is thinking...</p>
              </div>
            ) : (
              <p className="text-xl leading-relaxed text-center mb-5" style={{ color: 'var(--navy)' }}>
                {description}
              </p>
            )}

            <div className="flex flex-col gap-3">
              {description && (
                <button className="btn-primary" onClick={() => speak(description)}>
                  {speaking
                    ? <><div className="recording-dot" style={{ background: 'white' }} /> Speaking...</>
                    : '🔊 Read to me again'}
                </button>
              )}
              {selectedPerson.phone && (
                <a href={`tel:${selectedPerson.phone}`} className="btn-success">
                  📞 Call {selectedPerson.name}
                </a>
              )}
              <button className="btn-secondary"
                onClick={() => { setSelectedPerson(null); stop() }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,39,68,0.7)' }}>
          <div className="card w-full max-w-lg animate-fade-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="text-center mb-5">
              <div className="text-5xl mb-2">👤</div>
              <h2 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Add Someone I Know</h2>
              <p className="text-lg mt-1" style={{ color: 'var(--text-muted)' }}>
                Tell me about this person and I will remember them for you
              </p>
            </div>

            <form onSubmit={handleAddContact} className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="input-label">Their Name *</label>
                <input
                  className="input-field"
                  value={addForm.name}
                  onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="E.g. Sunita, Dr. Mehta"
                  required
                />
              </div>

              {/* Nickname */}
              <div>
                <label className="input-label">What do you call them? (nickname)</label>
                <input
                  className="input-field"
                  value={addForm.nickname}
                  onChange={e => setAddForm(p => ({ ...p, nickname: e.target.value }))}
                  placeholder="E.g. Sunny, Didi"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="input-label">Who are they to you? *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {relationships.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAddForm(p => ({ ...p, relationship: r }))}
                      className="px-4 py-2 rounded-xl text-lg font-semibold transition-all"
                      style={{
                        background: addForm.relationship === r ? 'var(--coral)' : 'var(--warm-gray)',
                        color: addForm.relationship === r ? 'white' : 'var(--navy)',
                        border: addForm.relationship === r ? '2px solid var(--coral)' : '2px solid transparent',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="input-label">📞 Their Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  value={addForm.phone}
                  onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="E.g. +91-9876543210"
                />
              </div>

              {/* Location */}
              <div>
                <label className="input-label">📍 Where do they live?</label>
                <input
                  className="input-field"
                  value={addForm.address}
                  onChange={e => setAddForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="E.g. Delhi, nearby"
                />
              </div>

              {/* Key facts */}
              <div>
                <label className="input-label">Something I should remember about them</label>
                <input
                  className="input-field mb-3"
                  value={addForm.fact1}
                  onChange={e => setAddForm(p => ({ ...p, fact1: e.target.value }))}
                  placeholder='E.g. "She visits every Sunday"'
                />
                <input
                  className="input-field"
                  value={addForm.fact2}
                  onChange={e => setAddForm(p => ({ ...p, fact2: e.target.value }))}
                  placeholder='E.g. "He brings sweets when he visits"'
                />
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <button
                  id="save-contact-btn"
                  type="submit"
                  className="btn-success"
                  disabled={saving || !addForm.name.trim()}
                >
                  {saving
                    ? <><div className="spinner" /> Saving...</>
                    : '✅ Save This Person'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddContact(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
