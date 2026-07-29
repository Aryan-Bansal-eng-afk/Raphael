'use client'

import { useEffect, useState } from 'react'

interface Task {
  id: string
  title: string
  description: string | null
  scheduledTime: string
  recurrence: string
  category: string
  difficulty: string
  isCompleted: boolean
  createdAt: string
}

const categoryEmoji: Record<string, string> = {
  medicine: '💊', family: '👨‍👩‍👧', appointment: '🏥',
  exercise: '🚶', meal: '🍽️', other: '📌',
}

const difficultyColor: Record<string, string> = {
  easy: '#D1FAE5', medium: '#FEF3C7', hard: '#FEE2E2',
}

export default function GuardianTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', scheduledTime: '08:00',
    recurrence: 'daily', category: 'medicine', difficulty: 'easy',
  })

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => { setTasks(d.tasks || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.task) {
      setTasks(prev => [...prev, data.task])
      setShowAdd(false)
      setForm({ title: '', description: '', scheduledTime: '08:00', recurrence: 'daily', category: 'medicine', difficulty: 'easy' })
    }
    setSaving(false)
  }

  async function deleteTask(id: string) {
    setDeletingId(id)
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
    setDeletingId(null)
  }

  async function toggleComplete(task: Task) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: !task.isCompleted }),
    })
    const data = await res.json()
    if (data.task) {
      setTasks(prev => prev.map(t => t.id === task.id ? data.task : t))
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#1A2744' }}>Task Manager</h1>
          <p style={{ color: '#6B7280' }}>Manage daily tasks and routines for your patient</p>
        </div>
        <button id="add-task-btn" className="btn-primary"
          style={{ width: 'auto', padding: '12px 24px', fontSize: 16, borderRadius: 12 }}
          onClick={() => setShowAdd(true)}>
          + Add Task
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3 animate-float">✅</div>
          <p style={{ color: '#6B7280', fontSize: 18 }}>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-2xl font-semibold mb-2" style={{ color: '#1A2744' }}>No tasks yet</p>
          <p style={{ color: '#6B7280', fontSize: 16 }}>Add the first daily routine for your patient.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-fade-in">
          {tasks.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map(task => (
            <div key={task.id} className="card flex items-center gap-4"
              style={{ opacity: task.isCompleted ? 0.7 : 1 }}>
              {/* Complete checkbox */}
              <button onClick={() => toggleComplete(task)}
                className="w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: task.isCompleted ? '#22C55E' : 'white',
                  borderColor: task.isCompleted ? '#22C55E' : '#D1D5DB',
                }}>
                {task.isCompleted && <span className="text-white text-sm">✓</span>}
              </button>

              {/* Task info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xl">{categoryEmoji[task.category] || '📌'}</span>
                  <span className="font-bold text-lg" style={{ color: '#1A2744', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                    {task.title}
                  </span>
                  <span className="text-sm px-2 py-0.5 rounded-lg font-semibold"
                    style={{ background: difficultyColor[task.difficulty] || '#F3F4F6', color: '#374151' }}>
                    {task.difficulty}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm mb-1" style={{ color: '#6B7280' }}>{task.description}</p>
                )}
                <div className="flex gap-3 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: '#E8735A' }}>⏰ {task.scheduledTime}</span>
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>🔄 {task.recurrence}</span>
                </div>
              </div>

              {/* Delete */}
              <button id={`delete-task-${task.id}`} onClick={() => deleteTask(task.id)}
                className="text-sm px-3 py-2 rounded-lg font-semibold transition-all flex-shrink-0"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
                disabled={deletingId === task.id}>
                {deletingId === task.id ? '...' : '🗑️'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card w-full max-w-lg animate-fade-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="text-2xl font-bold mb-5" style={{ color: '#1A2744' }}>Add New Task</h2>
            <form onSubmit={addTask} className="flex flex-col gap-4">
              <div>
                <label className="input-label" style={{ fontSize: 15 }}>Task Title *</label>
                <input className="input-field" style={{ fontSize: 16 }} value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="E.g. Take blood pressure medicine" required />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: 15 }}>Description (optional)</label>
                <input className="input-field" style={{ fontSize: 16 }} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="E.g. One white tablet with water" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label" style={{ fontSize: 15 }}>Time</label>
                  <input type="time" className="input-field" style={{ fontSize: 16 }} value={form.scheduledTime}
                    onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))} required />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: 15 }}>Recurrence</label>
                  <select className="input-field" style={{ fontSize: 16 }} value={form.recurrence}
                    onChange={e => setForm(p => ({ ...p, recurrence: e.target.value }))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">One-time</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label" style={{ fontSize: 15 }}>Category</label>
                  <select className="input-field" style={{ fontSize: 16 }} value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="medicine">💊 Medicine</option>
                    <option value="family">👨‍👩‍👧 Family</option>
                    <option value="appointment">🏥 Appointment</option>
                    <option value="exercise">🚶 Exercise</option>
                    <option value="meal">🍽️ Meal</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: 15 }}>Difficulty</label>
                  <select className="input-field" style={{ fontSize: 16 }} value={form.difficulty}
                    onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" className="btn-primary" style={{ fontSize: 16, padding: '14px 24px' }} disabled={saving}>
                  {saving ? 'Saving...' : '✅ Add Task'}
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
