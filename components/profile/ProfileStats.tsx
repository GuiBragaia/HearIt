'use client'

import { emptyStats, type PersonStats } from '@/lib/people'
import { useSession } from '@/components/auth/session-context'
import { useI18n } from '@/lib/i18n'
import { formatNumber } from '@/lib/utils'

export function ProfileStats({ stats }: { stats?: PersonStats }) {
  const { t, locale } = useI18n()
  const { user } = useSession()
  const value = stats ?? user?.stats ?? emptyStats
  const secondary = [
    { value: `${value.accuracy}%`, label: t.profile.accuracy },
    { value: formatNumber(value.songsGuessed, locale), label: t.profile.songs },
    { value: `${value.averageTime}s`, label: t.profile.avg },
    { value: String(value.perfectGuesses), label: t.profile.perfects },
    { value: String(value.bestStreak), label: t.profile.best },
  ]

  return (
    <div>
      <div className="enter enter-3 grid grid-cols-2 gap-8 border-b border-[#1e231c] pb-8">
        <div>
          <p className="display m-0 text-[clamp(56px,12vw,88px)] leading-none text-primary">{value.streak}</p>
          <p className="mt-2 mb-0 text-sm text-muted-foreground">{t.profile.streak}</p>
        </div>
        <div>
          <p className="display m-0 text-[clamp(56px,12vw,88px)] leading-none">
            {formatNumber(value.points, locale)}
          </p>
          <p className="mt-2 mb-0 text-sm text-muted-foreground">{t.profile.points}</p>
        </div>
      </div>
      <div className="enter enter-4 mt-6 flex flex-wrap gap-x-8 gap-y-4">
        {secondary.map((stat) => (
          <div key={stat.label} className="min-w-[92px]">
            <p className="m-0 text-xl tracking-tight">{stat.value}</p>
            <p className="mt-1 mb-0 text-xs text-[#6d7568]">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
