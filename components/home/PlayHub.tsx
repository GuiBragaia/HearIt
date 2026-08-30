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
import { formatNumber } from '@/lib/utils'

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
          <br />
          <em>{played ? t.home.dailyDone : t.home.titleb}</em>
        </motion.h1>

        <motion.p
          className="play-hub-lead"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay * 3, ease: [0.16, 1, 0.3, 1] }}
        >
          {played ? t.home.playsCopy : t.home.dailyCopy}
        </motion.p>

        <motion.div
          className="play-hub-actions"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay * 4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href={played ? '/plays' : '/daily'}
            className="land-play play-hub-go"
          >
            {played ? t.nav.plays : t.home.play}
          </Link>
          <Link href={played ? '/daily' : '/plays'} className="land-daily play-hub-side">
            {played ? t.nav.daily : t.nav.plays}
          </Link>
        </motion.div>

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
        </motion.p>

        <motion.button
          type="button"
          onClick={() => setHello((value) => value + 1)}
          className="play-updates"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: delay * 7 }}
        >
          {t.home.updates}
        </motion.button>
      </div>

      <ViewportWaveform className="play-hub-wave" />
    </motion.section>
  )
}
