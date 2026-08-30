'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { songForDay } from '@/lib/songs'

const previewBySong = new Map<string, string>()

export type PlaySource = {
  id: string
  previewUrl?: string
  title?: string
  artist?: string
}

async function resolvePreviewUrl(source?: PlaySource) {
  const song = songForDay()
  const key = source?.id ?? song.id
  const hit = previewBySong.get(key)
  if (hit) return hit

  if (source?.previewUrl) {
    previewBySong.set(key, source.previewUrl)
    return source.previewUrl
  }

  const target =
    source?.title && source.artist
      ? { id: source.id, title: source.title, artist: source.artist }
      : song
  const params = new URLSearchParams({
    id: target.id,
    title: target.title,
    artist: target.artist,
  })
  const response = await fetch(`/api/daily-track?${params}`, { cache: 'force-cache' })
  const track = (await response.json()) as { previewUrl?: string }
  if (!response.ok || !track.previewUrl) throw new Error('preview')
  previewBySong.set(key, track.previewUrl)
  return track.previewUrl
}

export function useTrackPlayer(clipUntil: number, source?: PlaySource | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const modeRef = useRef<'clip' | 'full'>('clip')
  const untilRef = useRef(clipUntil)
  const frameRef = useRef(0)
  const endedRef = useRef<(() => void) | null>(null)
  const sourceRef = useRef(source)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pulse, setPulse] = useState(0)
  const [ready, setReady] = useState(false)

  untilRef.current = clipUntil
  sourceRef.current = source

  const stopTick = () => cancelAnimationFrame(frameRef.current)

  const assignedUrlRef = useRef('')
  const loadGenRef = useRef(0)
  const inflightRef = useRef<{ url: string; promise: Promise<HTMLAudioElement> } | null>(null)

  const ensure = useCallback(async () => {
    if (sourceRef.current === null) throw new Error('preview')
    if (!audioRef.current) {
      const node = new Audio()
      node.preload = 'auto'
      node.setAttribute('playsinline', '')
      node.setAttribute('referrerpolicy', 'no-referrer')
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
    const url = await resolvePreviewUrl(sourceRef.current ?? undefined)
    if (assignedUrlRef.current === url && audio.readyState >= 2) {
      setReady(true)
      return audio
    }
    if (inflightRef.current?.url === url) return inflightRef.current.promise

    const gen = (loadGenRef.current += 1)
    if (assignedUrlRef.current !== url) {
      assignedUrlRef.current = url
      setReady(false)
      audio.src = url
    }

    const promise = new Promise<HTMLAudioElement>((resolve, reject) => {
      if (audio.readyState >= 2) {
        resolve(audio)
        return
      }
      const timer = window.setTimeout(() => {
        cleanup()
        assignedUrlRef.current = ''
        reject(new Error('preview'))
      }, 10000)
      const onReady = () => {
        if (gen !== loadGenRef.current) return
        cleanup()
        resolve(audio)
      }
      const onError = () => {
        if (gen !== loadGenRef.current) return
        cleanup()
        assignedUrlRef.current = ''
        reject(new Error('preview'))
      }
      const cleanup = () => {
        window.clearTimeout(timer)
        audio.removeEventListener('loadeddata', onReady)
        audio.removeEventListener('canplay', onReady)
        audio.removeEventListener('error', onError)
      }
      audio.addEventListener('loadeddata', onReady)
      audio.addEventListener('canplay', onReady)
      audio.addEventListener('error', onError)
    }).finally(() => {
      if (inflightRef.current?.url === url) inflightRef.current = null
    })

    inflightRef.current = { url, promise }
    const readyAudio = await promise
    setReady(true)
    return readyAudio
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

  const sourceIdRef = useRef<string | undefined>(undefined)

  const waiting = source === null

  useEffect(() => {
    if (waiting) {
      stop()
      sourceIdRef.current = undefined
      return
    }
    const id = source?.id
    if (sourceIdRef.current && sourceIdRef.current !== id) {
      loadGenRef.current += 1
      inflightRef.current = null
      assignedUrlRef.current = ''
      stop()
      const audio = audioRef.current
      if (audio) {
        audio.removeAttribute('src')
        audio.load()
      }
    }
    sourceIdRef.current = id
  }, [waiting, source?.id, stop])

  useEffect(
    () => () => {
      loadGenRef.current += 1
      stopTick()
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
      audioRef.current = null
      assignedUrlRef.current = ''
      inflightRef.current = null
    },
    [],
  )

  useEffect(() => {
    if (modeRef.current === 'full') return
    stop()
  }, [clipUntil, stop])

  return { playClip, playFull, pause, stop, playing, progress, pulse, ready, onEnded }
}
