'use client'

import Link from 'next/link'
import { Crown, Flame } from 'lucide-react'
import type { LeaderboardRow } from '@/lib/mock'
import { formatDuration } from '@/lib/game'
import { formatWeekRange, weekWindow } from '@/lib/calendar'
import { useSession } from '@/components/auth/session-context'
import { Avatar } from '@/components/profile/Avatar'
import { NameBadges } from '@/components/profile/NameBadges'
import { profileHref } from '@/lib/people'
import { useI18n } from '@/lib/i18n'
import { cn, formatNumber } from '@/lib/utils'

export function WeekChampions({
  rows,
  week,
  countdown,
}: {
  rows: LeaderboardRow[]
  week: { start: string; end: string } | null
  countdown: string
}) {
  const { t, locale } = useI18n()
  const count = Math.min(rows.length, 3) as 0 | 1 | 2 | 3
  const current = weekWindow()

  if (!count) {
    return (
      <div className="week-champs is-empty py-20 text-center enter enter-3">
        <p className="week-champs-kicker">{t.leaderboard.championsKicker}</p>
        <p className="display week-champs-title">{t.leaderboard.championsEmpty}</p>
        <p className="week-champs-lead mx-auto">{t.leaderboard.championsEmptyHint}</p>
      </div>
    )
  }

  return (
    <section className="week-champs enter enter-3">
      <header className="week-champs-head">
        <p className="week-champs-kicker">{t.leaderboard.championsKicker}</p>
        <h2 className="display week-champs-title">{t.leaderboard.championsTitle}</h2>
        {week ? (
          <p className="mt-3 mb-0 text-sm text-[#8d967f]">{formatWeekRange(week.start, week.end, locale)}</p>
        ) : null}
        <p className="week-champs-lead">{t.leaderboard.championsLead}</p>
      </header>

      <div className={cn('week-champs-stage', `is-${count}`)}>
        {rows.slice(0, 3).map((row, index) => (
          <ChampionCard key={row.id} row={row} place={(index + 1) as 1 | 2 | 3} />
        ))}
      </div>

      <div className="scores-cycle week-champs-foot">
        <p className="scores-cycle-range">
          <span className="scores-cycle-label">{t.leaderboard.championsNext}</span>
          {formatWeekRange(current.start, current.end, locale)}
        </p>
        <p className="scores-cycle-clock">
          <span className="scores-cycle-label">{t.leaderboard.cycleReset}</span>
          {countdown}
        </p>
      </div>
    </section>
  )
}

function ChampionCard({ row, place }: { row: LeaderboardRow; place: 1 | 2 | 3 }) {
  const { t, locale } = useI18n()
  const { user } = useSession()
  const first = place === 1
  const photo = row.you ? user?.photo : row.photo
  const initials = row.you
    ? (user?.initials ?? row.name.slice(0, 2).toUpperCase())
    : (row.initials ?? row.name.slice(0, 2).toUpperCase())

  return (
    <Link
      href={profileHref(row.handle ?? row.id, row.you)}
      prefetch={false}
      className={cn('week-champs-card', `is-${place}`)}
    >
      {first ? <Crown size={18} className="week-champs-crown" aria-hidden /> : null}
      <p className="display week-champs-place">{String(place).padStart(2, '0')}</p>
      <Avatar src={photo} initials={initials} size={first ? 'lg' : 'md'} className="mt-5" />
      <p className="week-champs-name">
        <span>{row.name}</span>
        <NameBadges handle={row.handle} compact />
        {row.you ? <i className="shrink-0 text-xs not-italic text-primary">{t.leaderboard.you}</i> : null}
      </p>
      <p className="display week-champs-score">{formatNumber(row.score, locale)}</p>
      <p className="week-champs-meta">
        <span>{formatDuration(row.time)}</span>
        <span className="inline-flex items-center gap-1">
          <Flame size={11} className="text-primary" />
          {row.streak}
        </span>
        <span>{t.leaderboard.ptsWeek}</span>
      </p>
    </Link>
  )
}
