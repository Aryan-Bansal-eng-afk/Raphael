'use client'

import { useEffect, useState } from 'react'

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

export default function GuardianPeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [relationship, setRelationship] = useState('Daughter')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [facts, setFacts] = useState<string[]>([''])
  const [photo, setPhoto] = useState<File | null>(null)

  useEffect(() => {
    fetch('/api/people')
      .then(r => r.json())
      .then(d => { setPeople(d.people || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function addPerson(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const fd = new FormData()
    fd.append('name', name)
    fd.append('nickname', nickname)
    fd.append('relationshipLabel', relationship)
    fd.append('phone', phone)
    fd.append('address', address)
    fd.append('keyFacts', JSON.stringify(facts.filter(f => f.trim())))
    if (photo) fd.append('photo', photo)

    const res = await fetch('/api/people', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.person) {
      setPeople(prev => [...prev, data.person])
      setShowAdd(false)
      setName(''); setNickname(''); setRelationship('Daughter'); setPhone(''); setAddress(''); setFacts(['']); setPhoto(null)
    }
    setSaving(false)
  }

  async function deletePerson(id: string) {
    setDeletingId(id)
    await fetch(`/api/people/${id}`, { method: 'DELETE' })
    setPeople(prev => prev.filter(p => p.id !== id))
    setDeletingId(null)
  }

  function updateFact(i: number, val: string) {
    setFacts(prev => prev.map((f, idx) => idx === i ? val : f))
  }

  function addFactField() { setFacts(prev => [...prev, '']) }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#1A2744' }}>People Registry</h1>
          <p style={{ color: '#6B7280' }}>People your patient knows and loves</p>
        </div>
        <button id="add-person-btn" className="btn-primary"
          style={{ width: 'auto', padding: '12px 24px', fontSize: 16, borderRadius: 12 }}
          onClick={() => setShowAdd(true)}>
          + Add Person
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3 animate-float">👥</div>
          <p style={{ color: '#6B7280', fontSize: 18 }}>Loading people...</p>
        </div>
      ) : people.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">💝</div>
          <p className="text-2xl font-semibold mb-2" style={{ color: '#1A2744' }}>No people added yet</p>
          <p style={{ color: '#6B7280', fontSize: 16 }}>Add family members and friends your patient knows.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {people.map(person => (
            <div key={person.id} className="card">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: '#F3F4F6' }}>
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">
                      {person.relationshipLabel === 'Doctor' ? '👨‍⚕️' :
                       ['Daughter', 'Granddaughter', 'Wife', 'Mother'].includes(person.relationshipLabel) ? '👩' : '👨'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: '#1A2744' }}>{person.name}</h3>
                      <span className="text-sm font-semibold px-2 py-0.5 rounded-lg"
                        style={{ background: '#EDE9FE', color: '#5B21B6' }}>
                        {person.relationshipLabel}
                      </span>
                    </div>
                    <button id={`delete-person-${person.id}`} onClick={() => deletePerson(person.id)}
                      className="text-xs px-2 py-1 rounded-lg" style={{ background: '#FEE2E2', color: '#991B1B' }}
                      disabled={deletingId === person.id}>
                      {deletingId === person.id ? '...' : '🗑️'}
                    </button>
                  </div>

                  {person.phone && (
                    <p className="text-sm mt-1" style={{ color: '#6B7280' }}>📞 {person.phone}</p>
                  )}
                  {person.address && (
                    <p className="text-sm" style={{ color: '#6B7280' }}>📍 {person.address}</p>
                  )}

                  {person.keyFacts.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-0.5">
                      {person.keyFacts.slice(0, 2).map((fact, i) => (
                        <li key={i} className="text-sm flex items-start gap-1" style={{ color: '#4B5563' }}>
                          <span>•</span> {fact}
                        </li>
                      ))}
                      {person.keyFacts.length > 2 && (
                        <li className="text-sm" style={{ color: '#9CA3AF' }}>+{person.keyFacts.length - 2} more</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Person Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card w-full max-w-lg animate-fade-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="text-2xl font-bold mb-5" style={{ color: '#1A2744' }}>Add a Person</h2>
            <form onSubmit={addPerson} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label" style={{ fontSize: 14 }}>Full Name *</label>
                  <input className="input-field" style={{ fontSize: 15 }} value={name}
                    onChange={e => setName(e.target.value)} placeholder="Arjun Sharma" required />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: 14 }}>Nickname</label>
                  <input className="input-field" style={{ fontSize: 15 }} value={nickname}
                    onChange={e => setNickname(e.target.value)} placeholder="Arjun" />
                </div>
              </div>
              <div>
                <label className="input-label" style={{ fontSize: 14 }}>Relationship *</label>
                <select className="input-field" style={{ fontSize: 15 }} value={relationship}
                  onChange={e => setRelationship(e.target.value)}>
                  {['Daughter', 'Son', 'Grandson', 'Granddaughter', 'Wife', 'Husband', 'Sister', 'Brother', 'Doctor', 'Caregiver', 'Friend', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label" style={{ fontSize: 14 }}>Phone</label>
                  <input className="input-field" style={{ fontSize: 15 }} value={phone}
                    onChange={e => setPhone(e.target.value)} placeholder="+91-9876543210" />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: 14 }}>Address / City</label>
                  <input className="input-field" style={{ fontSize: 15 }} value={address}
                    onChange={e => setAddress(e.target.value)} placeholder="Mumbai" />
                </div>
              </div>
              <div>
                <label className="input-label" style={{ fontSize: 14 }}>Photo (optional)</label>
                <input type="file" accept="image/*" className="input-field" style={{ fontSize: 14, padding: '10px 14px' }}
                  onChange={e => setPhoto(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: 14 }}>Key Facts (help the patient remember)</label>
                {facts.map((fact, i) => (
                  <input key={i} className="input-field mb-2" style={{ fontSize: 15 }} value={fact}
                    onChange={e => updateFact(i, e.target.value)}
                    placeholder={`E.g. "Calls every Sunday"`} />
                ))}
                <button type="button" className="text-sm font-semibold" style={{ color: '#E8735A' }}
                  onClick={addFactField}>+ Add another fact</button>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" className="btn-primary" style={{ fontSize: 16, padding: '14px 24px' }} disabled={saving}>
                  {saving ? 'Saving...' : '✅ Add Person'}
                </button>
                <button type="button" className="btn-secondary" style={{ fontSize: 16, padding: '14px 24px' }} onClick={() => setShowAdd(false)}>
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
