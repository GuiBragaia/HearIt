'use client'

import { Headphones, Plus } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { PlaybackButton } from '@/components/audio/PlaybackButton'
import { Waveform } from '@/components/audio/Waveform'
import { useTrackPlayer } from '@/components/audio/use-track-player'
import { usePlaying } from '@/components/layout/playing-context'
import { QuietError } from '@/components/states/QuietError'
import { HearLoading } from '@/components/states/HearLoading'
import {
  CLIP_LENGTHS,
  dailyKey,
  formatDuration,
  matchesSong,
  scoreForLevel,
  skipDelta,
  type GamePhase,
} from '@/lib/game'
import { readDailyRun, writeDailyRun, DAILY_RESET_EVENT } from '@/lib/daily-run'
import { countPlayersToday } from '@/lib/db'
import { useI18n } from '@/lib/i18n'
import { songForDay } from '@/lib/songs'
import { useSession } from '@/components/auth/session-context'
import { cn, formatNumber } from '@/lib/utils'
import { DailyDone } from './DailyDone'
import { DurationProgress } from './DurationProgress'
import { GuessInput } from './GuessInput'
import { ResultScreen } from './ResultScreen'
import { ShareCard } from './ShareCard'

const HOLD_MISS = 2800
const HOLD_HIT = 2800
const HOLD_PERFECT = 4000
const HOLD_CLUTCH = 3600
const HOLD_FAILED = 2000
const LAST_LEVEL = CLIP_LENGTHS.length - 1

export function GameBoard() {
  const { t, locale } = useI18n()
  const { user, ready: sessionReady, refresh } = useSession()
  const reduce = useReducedMotion()
  const { setPlaying, setFeel } = usePlaying()
  const dailySong = songForDay()
  const [playersToday, setPlayersToday] = useState(0)
  const [level, setLevel] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [guess, setGuess] = useState('')
  const [score, setScore] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [error, setError] = useState(false)
  const [boot, setBoot] = useState(true)
  const [returning, setReturning] = useState(false)
  const levelRef = useRef(0)
  const timers = useRef<number[]>([])

  const duration = CLIP_LENGTHS[Math.min(level, CLIP_LENGTHS.length - 1)]
  const player = useTrackPlayer(duration)
  const locked =
    phase === 'wrong' || phase === 'correct' || phase === 'perfect' || phase === 'failed' || phase === 'result'
  const won = score > 0
  const extra = skipDelta(level)
  const canHearMore = extra > 0 && !locked
  const lastChance = level === LAST_LEVEL && !locked
  const missed = phase === 'wrong'
  const perfectHit = phase === 'perfect'
  const clutchHit = phase === 'correct' && level === LAST_LEVEL
  const hit = phase === 'correct' || phase === 'perfect'

  levelRef.current = level

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
  }

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  useEffect(() => {
    if (!sessionReady) return
    let live = true
    void readDailyRun(dailySong.id, user?.id).then((run) => {
      if (!live) return
      if (run) {
        setLevel(run.level)
        setScore(run.score)
        setPhase('result')
        setReturning(true)
      }
      setBoot(false)
    })
    void countPlayersToday().then((count) => {
      if (live) setPlayersToday(count)
    })
    return () => {
      live = false
    }
  }, [sessionReady, user?.id, dailySong.id])

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
    const text = (next ?? guess).trim()
    if (!text || locked) return
    if (next) setGuess(next)
    if (matchesSong(text, dailySong)) {
      setScore(scoreForLevel(level))
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
      void player.playFull().catch(() => setError(true))
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
    setScore(0)
    setPhase('failed')
    void player.playFull().catch(() => undefined)
    later(() => setPhase('result'), reduce ? 0 : HOLD_FAILED)
  }

  const togglePlay = async () => {
    if (phase === 'wrong') return
    try {
      if (player.playing) player.pause()
      else if (won || phase === 'failed' || phase === 'result') await player.playFull({ resume: true })
      else await player.playClip()
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    if (boot || phase !== 'result') return
    void writeDailyRun(
      {
        key: dailyKey(),
        songId: dailySong.id,
        won: score > 0,
        score,
        duration,
        level,
      },
      user?.id,
    ).then(() => {
      if (user?.id) void refresh()
    })
  }, [boot, phase, score, duration, level, dailySong.id, user?.id, refresh])

  useEffect(() => {
    const reset = () => {
      clearTimers()
      player.stop()
      setFeel(null)
      setPlaying(false)
      setLevel(0)
      setScore(0)
      setGuess('')
      setShareOpen(false)
      setError(false)
      setReturning(false)
      setPhase('idle')
    }
    window.addEventListener(DAILY_RESET_EVENT, reset)
    return () => window.removeEventListener(DAILY_RESET_EVENT, reset)
  }, [player.stop, setFeel, setPlaying])

  if (boot) {
    return <HearLoading />
  }

  if (error) {
    return (
      <QuietError
        onRetry={() => {
          setError(false)
          void player.playClip()
        }}
      />
    )
  }

  if (phase === 'result') {
    return (
      <>
        {returning ? (
          <DailyDone
            won={won}
            song={dailySong}
            duration={duration}
            score={score}
            playing={player.playing}
            onTogglePlay={() => void togglePlay()}
            onShare={() => setShareOpen(true)}
          />
        ) : (
          <ResultScreen
            won={won}
            perfect={level === 0 && won}
            clutch={level === LAST_LEVEL && won}
            song={dailySong}
            duration={duration}
            score={score}
            playing={player.playing}
            onTogglePlay={() => void togglePlay()}
            onShare={() => setShareOpen(true)}
          />
        )}
        {shareOpen ? (
          <ShareCard won={won} duration={duration} score={score} onClose={() => setShareOpen(false)} />
        ) : null}
      </>
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
        <span>{t.daily.kicker}</span>
        <span>
          {level + 1} / {CLIP_LENGTHS.length}
        </span>
        <span>
          {formatNumber(playersToday, locale)} {t.daily.playedToday}
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
          <PlaybackButton playing={player.playing} onToggle={() => void togglePlay()} kind={won ? 'song' : 'clip'} />
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
