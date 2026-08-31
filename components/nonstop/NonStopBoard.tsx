'use client'

import { Headphones, Plus } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PlaybackButton } from '@/components/audio/PlaybackButton'
import { Waveform } from '@/components/audio/Waveform'
import { useTrackPlayer } from '@/components/audio/use-track-player'
import { usePlaying } from '@/components/layout/playing-context'
import { QuietError } from '@/components/states/QuietError'
import { HearLoading } from '@/components/states/HearLoading'
import { DurationProgress } from '@/components/game/DurationProgress'
import { GuessInput } from '@/components/game/GuessInput'
import { NonStopBeat } from '@/components/nonstop/NonStopBeat'
import { useSession } from '@/components/auth/session-context'
import type { HearTrack } from '@/lib/deezer'
import {
  CLIP_LENGTHS,
  formatDuration,
  matchesSong,
  skipDelta,
  spaceArtists,
  type GamePhase,
} from '@/lib/game'
import { useI18n } from '@/lib/i18n'
import { loadNonstopQueue } from '@/lib/nonstop-queue'
import { recordNonstopNamed } from '@/lib/nonstop-stats'
import { readHeardIds, rememberHeardIds } from '@/lib/nonstop-heard'
import { songForDay } from '@/lib/songs'
import { cn } from '@/lib/utils'

const HOLD_MISS = 2400
const HOLD_HIT = 2000
const HOLD_PERFECT = 2800
const HOLD_CLUTCH = 2400
const HOLD_FAILED = 1600
const LAST_LEVEL = CLIP_LENGTHS.length - 1
const LOW_WATER = 3

function mergeTracks(current: HearTrack[], incoming: HearTrack[], seen: Set<string>) {
  const have = new Set(current.map((track) => track.id))
  const extra: HearTrack[] = []
  for (const track of incoming) {
    if (have.has(track.id) || seen.has(track.id)) continue
    have.add(track.id)
    extra.push(track)
  }
  const head = current[0]
  if (!head) return spaceArtists(extra)
  return [head, ...spaceArtists([...current.slice(1), ...extra], 4, [head.artist])]
}

export function NonStopBoard({ initialQueue }: { initialQueue: HearTrack[] }) {
  const { t } = useI18n()
  const { user } = useSession()
  const reduce = useReducedMotion()
  const { setPlaying, setFeel } = usePlaying()
  const dailySong = songForDay()
  const [queue, setQueue] = useState<HearTrack[]>(initialQueue)
  const [level, setLevel] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [guess, setGuess] = useState('')
  const [named, setNamed] = useState(0)
  const [error, setError] = useState(false)
  const [boot, setBoot] = useState(!initialQueue[0])
  const [hitThis, setHitThis] = useState(false)
  const [refill, setRefill] = useState(false)
  const levelRef = useRef(0)
  const timers = useRef<number[]>([])
  const filling = useRef(false)
  const queueRef = useRef<HearTrack[]>([])
  const heardUser = user?.id
  const seenRef = useRef<string[]>(heardUser ? readHeardIds(heardUser) : [])

  const track = queue[0] ?? null
  const duration = CLIP_LENGTHS[Math.min(level, CLIP_LENGTHS.length - 1)]
  const player = useTrackPlayer(
    duration,
    track ? { id: track.id, previewUrl: track.previewUrl, title: track.title, artist: track.artist } : null,
  )
  const locked =
    phase === 'wrong' || phase === 'correct' || phase === 'perfect' || phase === 'failed' || phase === 'result'
  const extra = skipDelta(level)
  const canHearMore = extra > 0 && !locked
  const lastChance = level === LAST_LEVEL && !locked
  const missed = phase === 'wrong'
  const perfectHit = phase === 'perfect'
  const clutchHit = phase === 'correct' && level === LAST_LEVEL
  const hit = phase === 'correct' || phase === 'perfect'
  const favKey = (user?.favorites ?? []).join(',')

  levelRef.current = level
  queueRef.current = queue

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
  }

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const fill = useCallback(
    async (current: HearTrack[]) => {
      if (filling.current) return current
      filling.current = true
      try {
        const incoming = await loadNonstopQueue({
          favs: favKey ? favKey.split(',') : [],
          exclude: dailySong.title,
          seen: [...(heardUser ? readHeardIds(heardUser) : []), ...seenRef.current, ...current.map((item) => item.id)],
        })
        if (heardUser) rememberHeardIds(heardUser, incoming.map((item) => item.id))
        seenRef.current = [...seenRef.current, ...incoming.map((item) => item.id)]
        return mergeTracks(current, incoming, new Set(seenRef.current))
      } finally {
        filling.current = false
      }
    },
    [dailySong.title, favKey, heardUser],
  )

  useEffect(() => {
    if (initialQueue[0]) return
    let live = true
    void fill([])
      .then((next) => {
        if (!live) return
        if (!next[0]) setError(true)
        else setQueue(next)
        setBoot(false)
      })
      .catch(() => {
        if (!live) return
        setError(true)
        setBoot(false)
      })
    return () => {
      live = false
    }
  }, [fill, initialQueue])

  useEffect(() => {
    setPlaying(player.playing)
  }, [player.playing, setPlaying])

  useEffect(() => {
    if (phase === 'result') return
    if (phase === 'wrong' || phase === 'failed') setFeel('miss')
    else if (phase === 'perfect') setFeel('perfect')
    else if (phase === 'correct' && level === LAST_LEVEL) setFeel('clutch')
    else if (phase === 'correct') setFeel('hit')
    else setFeel(null)
  }, [phase, level, setFeel])

  useEffect(
    () => () => {
      clearTimers()
      setPlaying(false)
      setFeel(null)
    },
    [setPlaying, setFeel],
  )

  const goNextClip = () => {
    player.stop()
    setGuess('')
    if (levelRef.current >= CLIP_LENGTHS.length - 1) {
      setPhase('failed')
      later(() => setPhase('result'), reduce ? 0 : HOLD_FAILED)
      return
    }
    setLevel((value) => value + 1)
    setPhase('idle')
  }

  const submitGuess = (next?: string) => {
    if (!track) return
    const text = (next ?? guess).trim()
    if (!text || locked) return
    if (next) setGuess(next)
    if (matchesSong(text, track)) {
      setHitThis(true)
      setNamed((value) => {
        const next = value + 1
        if (user?.id) recordNonstopNamed(user.id, next)
        return next
      })
      if (level === 0) {
        setPhase('perfect')
        later(() => setPhase('result'), reduce ? 0 : HOLD_PERFECT)
      } else if (level === LAST_LEVEL) {
        setPhase('correct')
        later(() => setPhase('result'), reduce ? 0 : HOLD_CLUTCH)
      } else {
        setPhase('correct')
        later(() => setPhase('result'), reduce ? 0 : HOLD_HIT)
      }
      void player.playFull().catch(() => undefined)
      return
    }
    player.stop()
    setPhase('wrong')
    later(goNextClip, reduce ? 0 : HOLD_MISS)
  }

  const skip = () => {
    if (!canHearMore) return
    player.stop()
    goNextClip()
  }

  const giveUp = () => {
    if (locked) return
    setHitThis(false)
    setPhase('failed')
    void player.playFull().catch(() => undefined)
    later(() => setPhase('result'), reduce ? 0 : HOLD_FAILED)
  }

  const togglePlay = async () => {
    if (phase === 'wrong') return
    try {
      if (player.playing) player.pause()
      else if (hitThis || phase === 'failed' || phase === 'result') await player.playFull({ resume: true })
      else await player.playClip()
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'AbortError')) return
      if (queueRef.current.length > 1) goNextTrack()
      else setError(true)
    }
  }

  const goNextTrack = () => {
    if (!track) return
    clearTimers()
    player.stop()
    setFeel(null)
    seenRef.current = [...seenRef.current, track.id]
    if (heardUser) rememberHeardIds(heardUser, [track.id])
    setGuess('')
    setLevel(0)
    setHitThis(false)
    setPhase('idle')
    setError(false)
    const rest = queueRef.current.slice(1)
    if (rest[0]) {
      setQueue(rest)
      if (rest.length <= LOW_WATER) {
        void fill(rest)
          .then((next) => setQueue(next))
          .catch(() => undefined)
      }
      return
    }
    setRefill(true)
    void fill([])
      .then((next) => {
        if (!next[0]) setError(true)
        else setQueue(next)
        setRefill(false)
      })
      .catch(() => {
        setError(true)
        setRefill(false)
      })
  }

  if (boot || refill) return <HearLoading />

  if (!track) {
    return (
      <QuietError
        onRetry={() => {
          setError(false)
          setBoot(true)
          void fill([])
            .then((next) => {
              if (!next[0]) setError(true)
              else setQueue(next)
              setBoot(false)
            })
            .catch(() => {
              setError(true)
              setBoot(false)
            })
        }}
      />
    )
  }

  if (error) {
    return (
      <QuietError
        onRetry={() => {
          setError(false)
          void player.playClip().catch(() => setError(true))
        }}
      />
    )
  }

  if (phase === 'result') {
    return (
      <NonStopBeat
        won={hitThis}
        track={track}
        named={named}
        playing={player.playing}
        onTogglePlay={() => void togglePlay()}
        onNext={goNextTrack}
      />
    )
  }

  return (
    <motion.section
      animate={missed && !reduce ? { x: [0, -18, 16, -12, 9, -5, 0] } : { x: 0 }}
      transition={{ duration: 0.62, ease: 'easeOut' }}
      className={cn(
        'daily-screen',
        missed && 'is-miss',
        hit && 'is-hit',
        perfectHit && 'is-perfect',
        clutchHit && 'is-clutch',
      )}
    >
      {missed ? <span className="feel-miss" aria-hidden /> : null}
      {perfectHit ? (
        <span className="feel-perfect" aria-hidden>
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} />
          ))}
        </span>
      ) : clutchHit ? (
        <span className="feel-clutch" aria-hidden />
      ) : hit ? (
        <span className="feel-hit" aria-hidden />
      ) : null}

      <div className="daily-top">
        <span>{t.nav.plays}</span>
        <span>
          {level + 1} / {CLIP_LENGTHS.length}
        </span>
        <span>
          {named} {named === 1 ? t.nonstop.namedOne : t.nonstop.named}
        </span>
      </div>

      <div className="daily-listen">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${phase}-${duration}`}
            initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: hit && !reduce ? [1, 1.08, 1] : 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, filter: 'blur(6px)' }}
            transition={{ duration: reduce ? 0 : hit ? 0.7 : 0.35 }}
            className={cn(
              'daily-time',
              player.playing && 'is-on',
              missed && 'is-miss',
              hit && 'is-hit',
              perfectHit && 'is-perfect',
              clutchHit && 'is-clutch',
            )}
          >
            {formatDuration(duration)}
          </motion.p>
        </AnimatePresence>

        {phase === 'perfect' ? (
          <p className="daily-status is-hit is-perfect">{t.game.perfect}</p>
        ) : clutchHit ? (
          <p className="daily-status is-hit is-clutch">{t.game.clutch}</p>
        ) : phase === 'correct' ? (
          <p className="daily-status is-hit">{t.game.youGotIt}</p>
        ) : phase === 'wrong' ? (
          <p className="daily-status is-miss">
            {t.game.notQuite}
            <span>{t.game.hearMore}</span>
          </p>
        ) : phase === 'failed' ? (
          <p className="daily-status is-miss">{t.game.failed}</p>
        ) : (
          <p className="daily-status" />
        )}

        <Waveform
          active={player.playing || hit}
          progress={player.progress}
          intensity={perfectHit ? 1.65 : clutchHit ? 1.4 : hit ? 1.25 : missed ? 0.7 : 1}
        />

        <div className="daily-controls">
          <PlaybackButton playing={player.playing} onToggle={() => void togglePlay()} kind={hitThis ? 'song' : 'clip'} />
          {canHearMore ? (
            <button type="button" onClick={skip} className="hear-more">
              <Plus size={14} strokeWidth={2.4} />
              {t.game.skip}
              <b>+{formatDuration(extra)}</b>
            </button>
          ) : lastChance ? (
            <button type="button" onClick={giveUp} className="daily-giveup is-last">
              {t.game.giveUp}
            </button>
          ) : null}
        </div>

        <div className="daily-ladder">
          <DurationProgress level={level} />
        </div>
      </div>

      <div className="daily-answer">
        <GuessInput value={guess} onChange={setGuess} onSubmit={submitGuess} disabled={locked} />
        <p className="daily-hint">
          <Headphones size={12} /> {t.game.fones}
        </p>
        {!locked && !lastChance ? (
          <button type="button" className="daily-giveup" onClick={giveUp}>
            {t.game.giveUp}
          </button>
        ) : null}
      </div>
    </motion.section>
  )
}
