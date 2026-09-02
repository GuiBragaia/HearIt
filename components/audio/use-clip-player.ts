'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSettings } from '@/lib/settings'

const LOOP = 2.05

const PATTERN: Array<{ t: number; f: number; d: number }> = [
  { t: 0, f: 329.63, d: 0.11 },
  { t: 0.13, f: 392.0, d: 0.11 },
  { t: 0.26, f: 523.25, d: 0.2 },
  { t: 0.5, f: 493.88, d: 0.16 },
  { t: 0.7, f: 392.0, d: 0.16 },
  { t: 0.9, f: 329.63, d: 0.36 },
  { t: 1.34, f: 261.63, d: 0.18 },
  { t: 1.56, f: 329.63, d: 0.28 },
  { t: 1.86, f: 196.0, d: 0.18 },
]

function scheduleClip(ctx: AudioContext, duration: number) {
  const master = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2200
  master.gain.value = 0.2 * getSettings().volume
  filter.connect(master)
  master.connect(ctx.destination)

  const oscillators: OscillatorNode[] = []
  const now = ctx.currentTime + 0.03

  for (let cycle = 0; cycle < duration + LOOP; cycle += LOOP) {
    for (const note of PATTERN) {
      const start = cycle + note.t
      if (start >= duration) continue
      const end = Math.min(start + note.d, duration)
      if (end - start < 0.02) continue

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = note.f
      osc.connect(gain)
      gain.connect(filter)

      const t0 = now + start
      const t1 = now + end
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.28, t0 + 0.018)
      gain.gain.exponentialRampToValueAtTime(0.0001, t1)

      osc.start(t0)
      osc.stop(t1 + 0.02)
      oscillators.push(osc)
    }
  }

  return { oscillators, master, startedAt: now }
}

export function useClipPlayer(duration: number) {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ oscillators: OscillatorNode[]; master: GainNode } | null>(null)
  const frameRef = useRef<number>(0)
  const endedRef = useRef<(() => void) | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pulse, setPulse] = useState(0)

  const stopNodes = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    nodesRef.current?.oscillators.forEach((osc) => {
      try {
        osc.stop()
      } catch {
        /* already stopped */
      }
    })
    try {
      nodesRef.current?.master.disconnect()
    } catch {
      /* noop */
    }
    nodesRef.current = null
  }, [])

  const stop = useCallback(() => {
    stopNodes()
    setPlaying(false)
    setProgress(0)
  }, [stopNodes])

  const play = useCallback(async () => {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    if (!ctxRef.current) ctxRef.current = new AudioCtx()
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') await ctx.resume()

    stopNodes()
    const scheduled = scheduleClip(ctx, duration)
    nodesRef.current = scheduled
    setPlaying(true)
    setProgress(0)
    setPulse((value) => value + 1)

    const tick = () => {
      const elapsed = ctx.currentTime - scheduled.startedAt
      const next = Math.min(elapsed / duration, 1)
      setProgress(next)
      if (next >= 1) {
        stopNodes()
        setPlaying(false)
        setProgress(1)
        endedRef.current?.()
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [duration, stopNodes])

  const onEnded = useCallback((handler: () => void) => {
    endedRef.current = handler
  }, [])

  useEffect(() => () => {
    stopNodes()
    ctxRef.current?.close()
  }, [stopNodes])

  useEffect(() => {
    stop()
  }, [duration, stop])

  return { play, stop, playing, progress, pulse, onEnded }
}
