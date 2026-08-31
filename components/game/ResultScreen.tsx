'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { formatDuration, nextResetLabel } from '@/lib/game'
import { dailyNumber } from '@/lib/songs'
import type { Song } from '@/lib/mock'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useSession } from '@/components/auth/session-context'
import { PlaybackButton } from '@/components/audio/PlaybackButton'
import { ScoreDisplay } from './ScoreDisplay'
import { AlbumCover } from './AlbumCover'
import { SaveTrackButton } from './SaveTrackButton'
import { SecretReset } from './SecretReset'
import { useAlbumArt } from './use-album-art'

export function ResultScreen({
  won,
  perfect,
  clutch,
  song,
  duration,
  score,
  playing,
  onTogglePlay,
  onShare,
}: {
  won: boolean
  perfect: boolean
  clutch?: boolean
  song: Song
  duration: number
  score: number
  playing: boolean
  onTogglePlay: () => void
  onShare: () => void
}) {
  const { t } = useI18n()
  const { user } = useSession()
  const reduce = useReducedMotion()
  const [countdown, setCountdown] = useState(nextResetLabel())
  const art = useAlbumArt()

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(nextResetLabel()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const delay = reduce ? 0 : 0.08

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn('result-screen', won && 'is-win', perfect && 'is-perfect', clutch && 'is-clutch')}
    >
      <div className="result-mark" aria-hidden>
        <LogoMark size={220} />
      </div>
      <ViewportWaveform variant="horizon" hot={won && playing} />
      {perfect ? (
        <span className="feel-perfect" aria-hidden>
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} />
          ))}
        </span>
      ) : clutch ? (
        <span className="feel-clutch" aria-hidden />
      ) : won ? (
        <span className="feel-hit" aria-hidden />
      ) : (
        <span className="feel-miss" aria-hidden />
      )}

      <div className="result-body">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className={cn('result-kicker', won ? 'is-hit' : 'is-miss')}
        >
          {perfect ? t.game.perfectEar : clutch ? t.game.clutchEar : won ? t.game.youGotIt : t.game.failed}
        </motion.p>

        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay * 2 }}
          className="result-title"
        >
          {song.title}
        </motion.h2>
        <p className="result-artist">{song.artist}</p>

        <AlbumCover src={art} alt={`${song.title} — ${song.artist}`} won={won} playing={playing} />

        <div className="result-listen">
          <PlaybackButton playing={playing} onToggle={onTogglePlay} kind="song" />
          <SaveTrackButton id={song.id} title={song.title} artist={song.artist} artworkUrl={art} />
        </div>

        <div className="result-stats">
          <p className="result-time">{formatDuration(duration)}</p>
          {won ? <ScoreDisplay value={score} size="lg" /> : <p className="display text-4xl text-muted-foreground">+0</p>}
          <p className="result-note">{t.game.smaller}</p>
        </div>

        <p className="result-next">
          {t.game.tomorrow} <strong>{countdown}</strong>
        </p>
        <SecretReset className="result-issue">#{dailyNumber()}</SecretReset>

        <div className="result-actions">
          <button type="button" onClick={onShare} className="shine-btn result-share">
            {t.game.share}
          </button>
          {user ? null : (
            <Link href="/join" className="result-again no-underline">
              {t.game.keepScore}
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  )
}
