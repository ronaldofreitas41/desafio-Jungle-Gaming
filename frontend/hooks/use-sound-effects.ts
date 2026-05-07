'use client'

import { useCallback, useRef, useEffect } from 'react'

// Sound URLs - you can replace these with actual sound files
const SOUNDS = {
  bet: '/sounds/bet.mp3',
  cashout: '/sounds/cashout.mp3',
  crash: '/sounds/crash.mp3',
  win: '/sounds/win.mp3',
  tick: '/sounds/tick.mp3',
  countdown: '/sounds/countdown.mp3',
}

type SoundType = keyof typeof SOUNDS

export function useSoundEffects(enabled = false) {
  const audioRefs = useRef<Map<SoundType, HTMLAudioElement>>(new Map())
  
  // Preload sounds
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    
    Object.entries(SOUNDS).forEach(([key, url]) => {
      try {
        const audio = new Audio(url)
        audio.preload = 'auto'
        audio.volume = 0.5
        audioRefs.current.set(key as SoundType, audio)
      } catch {
        console.warn(`[v0] Failed to load sound: ${key}`)
      }
    })
    
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      audioRefs.current.clear()
    }
  }, [enabled])
  
  const play = useCallback((sound: SoundType, volume = 0.5) => {
    if (!enabled) return
    
    const audio = audioRefs.current.get(sound)
    if (audio) {
      audio.currentTime = 0
      audio.volume = volume
      audio.play().catch(() => {
        // Ignore autoplay errors
      })
    }
  }, [enabled])
  
  const stop = useCallback((sound: SoundType) => {
    const audio = audioRefs.current.get(sound)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [])
  
  const stopAll = useCallback(() => {
    audioRefs.current.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
  }, [])
  
  return {
    play,
    stop,
    stopAll,
  }
}

// Alternative: Web Audio API based sounds for better performance
export function useWebAudioSounds(enabled = false) {
  const contextRef = useRef<AudioContext | null>(null)
  
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    
    contextRef.current = new AudioContext()
    
    return () => {
      contextRef.current?.close()
    }
  }, [enabled])
  
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabled || !contextRef.current) return
    
    const ctx = contextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }, [enabled])
  
  const playBetSound = useCallback(() => {
    playTone(880, 0.1, 'sine')
  }, [playTone])
  
  const playCashoutSound = useCallback(() => {
    playTone(1200, 0.15, 'sine')
    setTimeout(() => playTone(1400, 0.1, 'sine'), 100)
  }, [playTone])
  
  const playCrashSound = useCallback(() => {
    playTone(200, 0.3, 'sawtooth')
    setTimeout(() => playTone(100, 0.4, 'sawtooth'), 100)
  }, [playTone])
  
  const playTickSound = useCallback(() => {
    playTone(440, 0.05, 'sine')
  }, [playTone])
  
  return {
    playBetSound,
    playCashoutSound,
    playCrashSound,
    playTickSound,
  }
}
