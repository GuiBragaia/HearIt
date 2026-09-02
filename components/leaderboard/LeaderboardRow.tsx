'use client'

import Link from 'next/link'
import { Flame } from 'lucide-react'
import { formatDuration } from '@/lib/game'
import type { LeaderboardRow } from '@/lib/mock'
import { profileHref } from '@/lib/people'
import { useSession } from '@/components/auth/session-context'
import { Avatar } from '@/components/profile/Avatar'
import { NameBadges } from '@/components/profile/NameBadges'
import { cn, formatNumber } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export function LeaderboardRowItem({
  row,
  index,
  locale,
}: {
  row: LeaderboardRow
  index: number
  locale: 'en' | 'pt'
}) {
  const { t } = useI18n()
  const { user } = useSession()
  const photo = row.you ? user?.photo : row.photo
  const initials = row.you
    ? (user?.initials ?? row.name.slice(0, 2).toUpperCase())
    : (row.initials ?? row.name.slice(0, 2).toUpperCase())

  return (
    <Link
      href={profileHref(row.handle ?? row.id, row.you)}
      prefetch={false}
      className={cn(
        'grid grid-cols-[48px_1fr_auto] items-center gap-4 py-4 text-foreground no-underline sm:grid-cols-[56px_1fr_72px_108px]',
        row.you && 'bg-primary/[0.06]',
      )}
    >
      <span className={cn('display text-[22px] leading-none', row.you ? 'text-primary' : 'text-[#5c6358]')}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <Avatar src={photo} initials={initials} size="sm" />
        <span className="min-w-0">
          <strong className="relative flex min-w-0 items-center gap-2 overflow-visible text-[15px] font-medium tracking-tight">
            <span className="truncate">{row.name}</span>
            <NameBadges handle={row.handle} compact />
            {row.you ? <span className="shrink-0 text-xs font-normal text-primary">{t.leaderboard.you}</span> : null}
          </strong>
          <span className="mt-1 hidden text-xs text-[#6d7568] sm:block">
            {formatDuration(row.time)} · {row.streak}d
          </span>
        </span>
      </span>
      <span className="hidden items-center justify-end gap-1 text-xs text-[#8b9384] sm:flex">
        <Flame size={11} className="text-primary" />
        {row.streak}
      </span>
      <b className={cn('text-right text-[15px] tracking-tight', row.you && 'text-primary')}>
        {formatNumber(row.score, locale)}
        <small className="ml-1 text-[11px] font-normal text-[#6d7568]">{t.leaderboard.pts}</small>
      </b>
    </Link>
  )
}
