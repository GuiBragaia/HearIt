'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { useSession } from '@/components/auth/session-context'
import { LogoMark } from '@/components/layout/Logo'
import { NonStopHello } from '@/components/nonstop/NonStopHello'
import { readDailyRun } from '@/lib/daily-run'
import { countPlayersToday } from '@/lib/db'
import { songForDay } from '@/lib/songs'
import { useI18n } from '@/lib/i18n'
import { cn, formatNumber } from '@/lib/utils'

function ModeBars({ kind }: { kind: 'daily' | 'plays' | 'online' }) {
  if (kind === 'daily') {
    return (
      <span className="play-room-bars is-daily" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
    )
  }
  if (kind === 'plays') {
    return (
      <span className="play-room-bars is-plays" aria-hidden>
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <em />
        <i />
      </span>
    )
  }
  return (
    <span className="play-room-bars is-online" aria-hidden>
      <i />
      <i />
      <i />
      <em />
      <i />
      <i />
      <i />
    </span>
  )
}

export function PlayHub() {
  const { t, locale } = useI18n()
  const { user, ready } = useSession()
  const reduce = useReducedMotion()
  const [played, setPlayed] = useState(false)
  const [playersToday, setPlayersToday] = useState(0)
  const [hello, setHello] = useState(0)
  const taps = useRef(0)
  const tapTimer = useRef<number>(0)
  const dailySong = songForDay()
  const delay = reduce ? 0 : 0.07

  const openHello = () => {
    taps.current += 1
    window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => {
      taps.current = 0
    }, 800)
    if (taps.current < 3) return
    taps.current = 0
    window.clearTimeout(tapTimer.current)
    setHello((value) => value + 1)
  }

  useEffect(() => {
    if (!ready) return
    let live = true
    void readDailyRun(dailySong.id, user?.id).then((run) => {
      if (live) setPlayed(Boolean(run))
    })
    void countPlayersToday().then((count) => {
      if (live) setPlayersToday(count)
    })
    return () => {
      live = false
    }
  }, [ready, user?.id, dailySong.id])

  useEffect(() => () => window.clearTimeout(tapTimer.current), [])

  const modes = [
    {
      href: '/daily',
      kind: 'daily' as const,
      title: t.nav.daily,
      status: played ? t.home.dailyDone : t.home.dailyLive,
      copy: t.home.dailyCopy,
      live: true,
      now: !played,
      done: played,
    },
    {
      href: '/plays',
      kind: 'plays' as const,
      title: t.nav.plays,
      status: t.home.dailyLive,
      copy: t.home.playsCopy,
      live: true,
      now: played,
      done: false,
    },
    {
      href: '/online',
      kind: 'online' as const,
      title: t.nav.online,
      status: t.home.developing,
      copy: t.home.onlineCopy,
      live: false,
      now: false,
      done: false,
    },
  ]

  return (
    <motion.section
      className="play-hub"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <NonStopHello reopen={hello} />

      <div className="play-hub-mark" aria-hidden>
        <div className="play-hub-mark-inner">
          <i className="hero-mark-bloom" />
          <LogoMark size={460} className="hero-mark-ghost" />
          <LogoMark size={460} className="hero-mark-core" />
        </div>
      </div>

      <div className="play-hub-copy">
        {t.home.kicker ? (
          <motion.button
            type="button"
            onClick={openHello}
            className="play-hub-kicker"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.home.kicker}
          </motion.button>
        ) : null}

        <motion.h1
          className="display play-hub-title"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: delay * 2, ease: [0.16, 1, 0.3, 1] }}
        >
          {t.home.titlea}
        </motion.h1>

        <motion.nav
          className="play-rooms"
          aria-label={t.nav.play}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: delay * 3, ease: [0.16, 1, 0.3, 1] }}
        >
          {modes.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              className={cn(
                'play-room',
                mode.live && 'is-live',
                !mode.live && 'is-soon',
                mode.now && 'is-now',
                mode.done && 'is-done',
              )}
            >
              <ModeBars kind={mode.kind} />
              <small>{mode.status}</small>
              <strong>{mode.title}</strong>
              <em>{mode.copy}</em>
            </Link>
          ))}
        </motion.nav>

        <motion.p
          className="play-hub-meta"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: delay * 6 }}
        >
          {user ? (
            <>
              <strong>{user.stats.streak}</strong> {t.home.streak}
            </>
          ) : (
            <Link href="/join">{t.profile.join}</Link>
          )}
          <span aria-hidden>·</span>
          <strong>{formatNumber(playersToday, locale)}</strong> {t.home.players}
          <span aria-hidden>·</span>
          <button type="button" onClick={() => setHello((value) => value + 1)} className="play-updates">
            <i className="play-updates-dot" aria-hidden />
            {t.home.updates}
          </button>
        </motion.p>
      </div>

      <ViewportWaveform className="play-hub-wave" />
    </motion.section>
  )
}
