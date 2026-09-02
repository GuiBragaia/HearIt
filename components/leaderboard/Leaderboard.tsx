'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Flame } from 'lucide-react'
import { formatDuration } from '@/lib/game'
import { type LeaderboardRow } from '@/lib/mock'
import { useSession } from '@/components/auth/session-context'
import { Avatar } from '@/components/profile/Avatar'
import { NameBadges } from '@/components/profile/NameBadges'
import { profileHref } from '@/lib/people'
import { loadLeaderboard } from '@/lib/db'
import { profileTitle } from '@/lib/session'
import { HearLoading } from '@/components/states/HearLoading'
import { useI18n } from '@/lib/i18n'
import { cn, formatNumber } from '@/lib/utils'
import { LeaderboardRowItem } from './LeaderboardRow'

type Board = 'global' | 'friends'
type Range = 'week' | 'month' | 'all'

export function Leaderboard() {
  const { t, locale } = useI18n()
  const { user, ready } = useSession()
  const [board, setBoard] = useState<Board>('global')
  const [range, setRange] = useState<Range>('week')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  const boards: Array<{ id: Board; label: string }> = [
    { id: 'global', label: t.leaderboard.global },
    { id: 'friends', label: t.leaderboard.friends },
  ]
  const ranges: Array<{ id: Range; label: string }> = [
    { id: 'week', label: t.leaderboard.week },
    { id: 'month', label: t.leaderboard.month },
    { id: 'all', label: t.leaderboard.all },
  ]

  useEffect(() => {
    if (!ready) return
    let live = true
    setLoading(true)
    void loadLeaderboard(range, board, user?.id, user?.friends ?? [])
      .then((next) => {
        if (!live) return
        setRows(
          next.map((row) => ({
            ...row,
            name: row.you && user ? profileTitle(user) : row.name,
          })),
        )
      })
      .catch(() => {
        if (live) setRows([])
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [ready, board, range, user])

  const usePodium = rows.length >= 3
  const podium = usePodium ? rows.slice(0, 3) : []
  const youIndex = rows.findIndex((row) => row.you)
  const you = youIndex >= 0 ? rows[youIndex] : undefined
  const field = usePodium
    ? youIndex >= 3
      ? rows.slice(3).filter((row) => !row.you)
      : rows.slice(3)
    : rows

  const empty = rows.length === 0

  return (
    <section className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-6">
      <div className="enter enter-1 mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display m-0 text-[clamp(40px,7vw,72px)]">{t.leaderboard.title}</h1>
        <p className="m-0 mb-1 text-sm text-muted-foreground">
          {loading ? '\u00a0' : `${formatNumber(rows.length, locale)} · ${t.leaderboard.field}`}
        </p>
      </div>

      <div className="enter enter-2 mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#1e231c] pb-px">
        <div className="flex gap-4">
          {boards.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBoard(item.id)}
              className={cn(
                'border-0 bg-transparent px-0 pb-3 text-sm',
                board === item.id ? 'text-primary shadow-[inset_0_-1px_0_var(--primary)]' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 pb-2">
          {ranges.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={cn(
                'border-0 bg-transparent px-2 py-1 text-sm',
                range === item.id ? 'text-foreground' : 'text-[#5f675c]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <HearLoading variant="block" />
      ) : empty ? (
        <div className="py-24 text-center enter enter-3">
          <p className="display m-0 text-4xl">{t.leaderboard.empty}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {board === 'friends' ? t.leaderboard.emptyFriends : t.leaderboard.emptyHint}
          </p>
        </div>
      ) : (
        <>
          {podium.length >= 3 ? (
            <div className="mb-12 grid items-end gap-3 md:grid-cols-3">
              {podium.map((row, index) => (
                <PodiumCard
                  key={row.id}
                  row={row}
                  place={index + 1}
                  locale={locale}
                  pts={t.leaderboard.pts}
                  enterClass={index === 0 ? 'enter enter-4' : index === 1 ? 'enter enter-5' : 'enter enter-6'}
                />
              ))}
            </div>
          ) : null}

          {field.length > 0 ? (
            <div className="enter enter-7">
              <p className="mb-2 text-sm text-[#6a7266]">{t.leaderboard.field}</p>
              <div className="divide-y divide-[#1c2119] border-y border-[#1c2119]">
                {field.map((row: LeaderboardRow) => {
                  const rank = rows.findIndex((item) => item.id === row.id)
                  return (
                    <motion.div
                      key={`${row.id}-${range}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.max(0, rank - 3) * 0.04 }}
                    >
                      <LeaderboardRowItem row={row} index={rank} locale={locale} />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </>
      )}

      {you && !loading && usePodium && youIndex >= 3 ? (
        <div className="sticky bottom-20 z-10 mt-8 md:bottom-6">
          <div className="enter enter-8 border border-primary/30 bg-[#0c0f0b]/95 px-4 py-3 backdrop-blur-md">
            <p className="mb-1 text-xs text-primary">{t.leaderboard.youLabel}</p>
            <LeaderboardRowItem row={you} index={youIndex} locale={locale} />
          </div>
        </div>
      ) : null}
    </section>
  )
}

function PodiumCard({
  row,
  place,
  locale,
  pts,
  enterClass,
}: {
  row: LeaderboardRow
  place: number
  locale: 'en' | 'pt'
  pts: string
  enterClass?: string
}) {
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
      className={cn(
        'border px-5 py-7 text-foreground no-underline',
        enterClass,
        first ? 'order-first border-primary/40 bg-[#141b10] md:order-2 md:py-10' : 'order-none border-[#2a3126] bg-[#0e120d]',
        place === 2 && 'md:order-1',
        place === 3 && 'md:order-3',
      )}
    >
      <p className={cn('display m-0 leading-none', first ? 'text-[64px] text-primary' : 'text-[40px] text-[#8d967f]')}>
        {String(place).padStart(2, '0')}
      </p>
      <Avatar src={photo} initials={initials} size={first ? 'lg' : 'md'} className="mt-5" />
      <p className="mt-4 mb-1 flex items-center gap-2 text-[15px] tracking-tight">
        <span className="truncate">{row.name}</span>
        <NameBadges handle={row.handle} compact />
      </p>
      <p className="display m-0 text-[28px]">{formatNumber(row.score, locale)}</p>
      <p className="mt-2 mb-0 flex items-center gap-3 text-xs text-[#7a8273]">
        <span>{formatDuration(row.time)}</span>
        <span className="inline-flex items-center gap-1">
          <Flame size={11} className="text-primary" />
          {row.streak}
        </span>
        <span>{pts}</span>
      </p>
    </Link>
  )
}
