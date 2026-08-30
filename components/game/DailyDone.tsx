'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { PlaybackButton } from '@/components/audio/PlaybackButton'
import { LogoMark } from '@/components/layout/Logo'
import { useSession } from '@/components/auth/session-context'
import { formatDuration, nextResetLabel } from '@/lib/game'
import { recapToday } from '@/lib/db'
import { dailyNumber } from '@/lib/songs'
import { type Song } from '@/lib/mock'
import { useI18n } from '@/lib/i18n'
import { cn, formatNumber } from '@/lib/utils'
import { AlbumCover } from './AlbumCover'
import { SecretReset } from './SecretReset'
import { useAlbumArt } from './use-album-art'

export function DailyDone({
  won,
  song,
  duration,
  score,
  playing,
  onTogglePlay,
  onShare,
}: {
  won: boolean
  song: Song
  duration: number
  score: number
  playing: boolean
  onTogglePlay: () => void
  onShare: () => void
}) {
  const { t, locale } = useI18n()
  const { user } = useSession()
  const reduce = useReducedMotion()
  const [countdown, setCountdown] = useState(nextResetLabel())
  const [recap, setRecap] = useState({ rank: 1, beat: 0, players: 0 })
  const art = useAlbumArt()

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(nextResetLabel()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let live = true
    void recapToday(score).then((next) => {
      if (live) setRecap(next)
    })
    return () => {
      live = false
    }
  }, [score])

  const delay = reduce ? 0 : 0.06

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className={cn('daily-done', won && 'is-win')}
    >
      <div className="result-mark" aria-hidden>
        <LogoMark size={220} />
      </div>
      <ViewportWaveform variant="horizon" hot={playing} />

      <div className="daily-done-body">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className="daily-done-kicker"
        >
          {t.daily.doneKicker}
        </motion.p>

        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay * 2 }}
          className="daily-done-title"
        >
          {t.daily.doneTitle}
        </motion.h2>
        <p className={cn('daily-done-outcome', won ? 'is-hit' : 'is-miss')}>
          {won ? t.daily.doneWon : t.daily.doneMiss}
        </p>
        <p className="daily-done-lead">{t.daily.doneLead}</p>

        <p className="daily-done-clock" aria-live="polite">
          {countdown}
        </p>
        <p className="daily-done-next">{t.daily.nextSong}</p>

        <p className="daily-done-song">{song.title}</p>
        <p className="daily-done-artist">{song.artist}</p>

        <AlbumCover src={art} alt={`${song.title} — ${song.artist}`} won={won} playing={playing} />

        <div className="result-listen">
          <PlaybackButton playing={playing} onToggle={onTogglePlay} kind="song" />
        </div>

        {user ? (
          <div className="daily-done-facts">
            <div>
              <b>{formatDuration(duration)}</b>
              <span>{t.daily.yourClip}</span>
            </div>
            <div>
              <b>{won ? `+${score}` : '+0'}</b>
              <span>{t.daily.yourScore}</span>
            </div>
            <div>
              <b>#{formatNumber(recap.rank, locale)}</b>
              <span>{t.daily.yourRank}</span>
            </div>
            <div>
              <b>{recap.beat}%</b>
              <span>{t.daily.beatPct}</span>
            </div>
            <div>
              <b>{user.stats.streak}</b>
              <span>{t.daily.streak}</span>
            </div>
            <div>
              <b>{formatNumber(recap.players, locale)}</b>
              <span>{t.daily.ofPlayers}</span>
            </div>
          </div>
        ) : (
          <div className="daily-done-guest">
            <p>{t.daily.guestNudge}</p>
            <Link href="/join" className="shine-btn daily-done-join no-underline">
              {t.daily.keepGoing}
            </Link>
            <p className="daily-done-aside">{t.nonstop.needsAccount}</p>
            <Link href="/join?next=/plays" className="result-again no-underline">
              {t.nav.plays}
            </Link>
          </div>
        )}

        <SecretReset className="result-issue">#{dailyNumber()}</SecretReset>

        <div className="result-actions">
          <button type="button" onClick={onShare} className={cn('shine-btn result-share', !user && 'is-quiet')}>
            {t.game.share}
          </button>
          {user ? (
            <Link href="/plays" className="result-again no-underline">
              {t.nonstop.keepHearing}
            </Link>
          ) : null}
        </div>
      </div>
    </motion.section>
  )
}
