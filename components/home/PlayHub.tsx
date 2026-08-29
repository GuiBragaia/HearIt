'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame } from 'lucide-react'
import { useSession } from '@/components/auth/session-context'
import { readDailyRun } from '@/lib/daily-run'
import { countPlayersToday } from '@/lib/db'
import { songForDay } from '@/lib/songs'
import { useI18n } from '@/lib/i18n'
import { cn, formatNumber } from '@/lib/utils'

export function PlayHub() {
  const { t, locale } = useI18n()
  const { user, ready } = useSession()
  const [played, setPlayed] = useState(false)
  const [playersToday, setPlayersToday] = useState(0)
  const dailySong = songForDay()

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

  const modes = [
    {
      href: '/daily',
      title: t.nav.daily,
      status: played ? t.home.dailyDone : t.home.dailyLive,
      copy: t.home.dailyCopy,
      live: true,
    },
    {
      href: '/plays',
      title: t.nav.plays,
      status: t.home.developing,
      copy: t.home.playsCopy,
      live: false,
    },
    {
      href: '/online',
      title: t.nav.online,
      status: t.home.developing,
      copy: t.home.onlineCopy,
      live: false,
    },
  ]

  return (
    <section className="mx-auto w-full max-w-[860px] px-5 pb-16 pt-8">
      {t.home.kicker ? <p className="enter enter-1 m-0 text-sm text-muted-foreground">{t.home.kicker}</p> : null}
      <h1 className="enter enter-2 display mt-3 mb-0 text-[clamp(44px,9vw,80px)]">{t.home.titlea}</h1>
      <p className="enter enter-3 mt-4 max-w-md text-lg text-muted-foreground">{t.home.titleb}</p>

      <Link
        href="/daily"
        className="enter enter-4 shine-btn mt-8 grid h-11 w-fit min-w-[140px] place-items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground no-underline"
      >
        {t.home.play}
      </Link>

      <div className="enter enter-5 mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
        {user ? (
          <p className="m-0 flex items-center gap-2">
            <Flame size={15} className="text-primary" />
            <strong className="text-foreground">{user.stats.streak}</strong> {t.home.streak}
          </p>
        ) : (
          <Link href="/join" className="m-0 text-muted-foreground no-underline">
            {t.profile.join}
          </Link>
        )}
        <p className="m-0">
          <strong className="text-foreground">{formatNumber(playersToday, locale)}</strong> {t.home.players}
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {modes.map((mode, index) => (
          <Link
            key={mode.href}
            href={mode.href}
            className={cn(
              'enter mode-card border p-5 no-underline',
              mode.live ? 'border-primary/30 bg-[#12180f]' : 'border-[#1e231c] bg-transparent',
              index === 0 && 'enter-6',
              index === 1 && 'enter-7',
              index === 2 && 'enter-8',
            )}
          >
            <p className="m-0 text-xs text-muted-foreground">{mode.status}</p>
            <h2 className="mt-2 mb-2 text-[22px] font-medium tracking-tight">{mode.title}</h2>
            <p className="m-0 text-sm leading-6 text-muted-foreground">{mode.copy}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
