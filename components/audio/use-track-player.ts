'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveDailyTrack } from '@/lib/itunes'
import { songForDay } from '@/lib/songs'

const previewBySong = new Map<string, string>()

async function resolvePreviewUrl() {
  const song = songForDay()
  const hit = previewBySong.get(song.id)
  if (hit) return hit
  const track = await resolveDailyTrack(song)
  previewBySong.set(song.id, track.previewUrl)
  return track.previewUrl
}

export function useTrackPlayer(clipUntil: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const modeRef = useRef<'clip' | 'full'>('clip')
  const untilRef = useRef(clipUntil)
  const frameRef = useRef(0)
  const endedRef = useRef<(() => void) | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pulse, setPulse] = useState(0)
  const [ready, setReady] = useState(false)

  untilRef.current = clipUntil

  const stopTick = () => cancelAnimationFrame(frameRef.current)

  const ensure = useCallback(async () => {
    if (!audioRef.current) {
      const node = new Audio()
      node.preload = 'auto'
      node.setAttribute('playsinline', '')
      node.addEventListener('ended', () => {
        if (modeRef.current !== 'full') return
        stopTick()
        setPlaying(false)
        setProgress(1)
        endedRef.current?.()
      })
      audioRef.current = node
    }
    const audio = audioRef.current
    if (!audio.src) {
      audio.src = await resolvePreviewUrl()
    }
    if (audio.readyState >= 2) {
      setReady(true)
      return audio
    }
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('preview'))
      }
      const cleanup = () => {
        audio.removeEventListener('loadeddata', onReady)
        audio.removeEventListener('error', onError)
      }
      audio.addEventListener('loadeddata', onReady)
      audio.addEventListener('error', onError)
      audio.load()
    })
    setReady(true)
    return audio
  }, [])

  const readProgress = useCallback((audio: HTMLAudioElement) => {
    if (modeRef.current === 'full') {
      const total = audio.duration || 30
      return Math.min(1, audio.currentTime / total)
    }
    return Math.min(1, audio.currentTime / Math.max(untilRef.current, 0.05))
  }, [])

  const tick = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (modeRef.current === 'clip' && audio.currentTime >= untilRef.current) {
      audio.pause()
      audio.currentTime = 0
      setPlaying(false)
      setProgress(1)
      endedRef.current?.()
      return
    }
    if (modeRef.current === 'full' && audio.ended) {
      setPlaying(false)
      setProgress(1)
      endedRef.current?.()
      return
    }
    setProgress(readProgress(audio))
    frameRef.current = requestAnimationFrame(tick)
  }, [readProgress])

  const pause = useCallback(() => {
    stopTick()
    audioRef.current?.pause()
    setPlaying(false)
  }, [])

  const stop = useCallback(() => {
    stopTick()
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    modeRef.current = 'clip'
    setPlaying(false)
    setProgress(0)
  }, [])

  const playClip = useCallback(async () => {
    const audio = await ensure()
    modeRef.current = 'clip'
    if (audio.currentTime <= 0.02 || audio.currentTime >= untilRef.current) {
      audio.currentTime = 0
    }
    await audio.play()
    setPlaying(true)
    setProgress(0)
    setPulse((value) => value + 1)
    stopTick()
    frameRef.current = requestAnimationFrame(tick)
  }, [ensure, tick])

  const playFull = useCallback(
    async (opts?: { resume?: boolean }) => {
      const audio = await ensure()
      modeRef.current = 'full'
      const canResume = opts?.resume && audio.currentTime > 0.05 && !audio.ended
      if (!canResume) audio.currentTime = 0
      await audio.play()
      setPlaying(true)
      setPulse((value) => value + 1)
      stopTick()
      frameRef.current = requestAnimationFrame(tick)
    },
    [ensure, tick],
  )

  const onEnded = useCallback((handler: () => void) => {
    endedRef.current = handler
  }, [])

  useEffect(() => {
    void ensure().catch(() => undefined)
    return () => {
      stopTick()
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.src = ''
      }
      audioRef.current = null
    }
  }, [ensure])

  useEffect(() => {
    if (modeRef.current === 'full') return
    stop()
  }, [clipUntil, stop])

  return { playClip, playFull, pause, stop, playing, progress, pulse, ready, onEnded }
}
