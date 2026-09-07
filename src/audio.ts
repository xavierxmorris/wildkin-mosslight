import { useCallback, useEffect, useRef, useState } from 'react'

type Sound = 'step' | 'select' | 'attack' | 'capture' | 'reward'
const melodies: Record<Sound, number[]> = {
  step: [130.81],
  select: [523.25, 659.25],
  attack: [220, 164.81, 293.66],
  capture: [392, 523.25, 659.25, 783.99],
  reward: [523.25, 659.25, 783.99, 1046.5],
}

function tone(context: AudioContext, frequency: number, when: number, duration: number, volume: number) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0, when)
  gain.gain.linearRampToValueAtTime(volume, when + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, when + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(when)
  oscillator.stop(when + duration + 0.02)
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
}

export function useSound(onError: (message: string) => void) {
  const [enabled, setEnabled] = useState(false)
  const context = useRef<AudioContext | null>(null)
  const play = useCallback((sound: Sound) => {
    if (!enabled || context.current?.state !== 'running') return
    const audio = context.current
    melodies[sound].forEach((frequency, index) => {
      tone(audio, frequency, audio.currentTime + index * 0.095, sound === 'step' ? 0.045 : 0.28, sound === 'step' ? 0.012 : 0.055)
    })
  }, [enabled])

  const toggle = useCallback(async () => {
    if (enabled) {
      setEnabled(false)
      await context.current?.suspend()
      return
    }
    if (!('AudioContext' in window)) {
      onError('This browser does not support the game soundscape. You can keep playing without sound.')
      return
    }
    const audio = context.current ?? new AudioContext()
    context.current = audio
    await audio.resume()
    setEnabled(true)
    tone(audio, 523.25, audio.currentTime, 0.4, 0.04)
  }, [enabled, onError])

  useEffect(() => {
    if (!enabled) return
    const notes = [261.63, 392, 329.63, 493.88, 293.66, 440, 329.63, 392]
    let index = 0
    const interval = setInterval(() => {
      const audio = context.current
      if (!audio || audio.state !== 'running' || document.hidden) return
      tone(audio, notes[index++ % notes.length], audio.currentTime, 1.6, 0.011)
    }, 1800)
    return () => clearInterval(interval)
  }, [enabled])

  useEffect(() => () => {
    if (context.current?.state !== 'closed') void context.current?.close()
  }, [])

  return { enabled, play, toggle: () => { void toggle().catch((error: unknown) => onError(error instanceof Error ? `Sound could not start: ${error.message}` : 'Sound could not start. Try toggling it again.')) } }
}
