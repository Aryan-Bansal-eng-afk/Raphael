'use client'

import { useCallback, useEffect, useRef } from 'react'

// ─── Module-level voice cache (computed once, reused forever) ─────────────────
let _cachedVoice: SpeechSynthesisVoice | null | undefined = undefined

function getFemaleVoice(): SpeechSynthesisVoice | null {
  if (_cachedVoice !== undefined) return _cachedVoice

  if (typeof window === 'undefined') return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null // will retry on next speak()

  const preferredNames = [
    'Google UK English Female',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Aria - English (United States)',
    'Microsoft Zira Desktop - English (United States)',
    'Microsoft Zira - English (United States)',
    'Samantha',
    'Karen',
    'Tessa',
    'Moira',
    'Fiona',
    'Victoria',
  ]

  for (const name of preferredNames) {
    const v = voices.find(vx => vx.name === name || vx.name.includes(name))
    if (v) { _cachedVoice = v; return v }
  }

  const byKeyword = voices.find(v =>
    v.name.toLowerCase().includes('female') ||
    v.name.toLowerCase().includes('zira') ||
    v.name.toLowerCase().includes('aria') ||
    v.name.toLowerCase().includes('samantha') ||
    v.name.toLowerCase().includes('karen') ||
    v.name.toLowerCase().includes('neerja')
  )

  _cachedVoice = byKeyword ?? voices.find(v => v.lang.startsWith('en')) ?? null
  return _cachedVoice
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SpeakOptions {
  onStart?: () => void
  onEnd?: () => void
  rate?: number
  pitch?: number
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useSpeech() {
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    // Trigger voice list loading so cache is warm on first speak
    if (typeof window !== 'undefined') {
      window.speechSynthesis.getVoices()
    }
    return () => {
      mounted.current = false
      // Stop any speech when this component/page unmounts
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel()
      }
    }
  }, []) // ← empty deps: runs once on mount / cleanup on unmount — NO pathname

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    // Always cancel before starting new speech
    window.speechSynthesis.cancel()

    const doSpeak = () => {
      if (!mounted.current) return // component already unmounted
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate  = options?.rate  ?? 0.88
      utter.pitch = options?.pitch ?? 1.15  // feminine pitch
      utter.volume = 1

      const voice = getFemaleVoice()
      if (voice) utter.voice = voice

      if (options?.onStart) utter.onstart = options.onStart
      utter.onend  = () => { if (mounted.current) options?.onEnd?.() }
      utter.onerror = () => { if (mounted.current) options?.onEnd?.() }

      window.speechSynthesis.speak(utter)
    }

    // If voices aren't loaded yet, wait for the event — but only attach once
    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak()
    } else {
      // Use addEventListener (not onvoiceschanged assignment) to avoid conflicts
      const handler = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler)
        doSpeak()
      }
      window.speechSynthesis.addEventListener('voiceschanged', handler)
      // Safety: fire anyway after 500ms even if event never comes
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler)
        doSpeak()
      }, 500)
    }
  }, []) // stable reference — safe to use in useEffect deps

  const stop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }
  }, [])

  return { speak, stop }
}
