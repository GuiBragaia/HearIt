'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Headphones, Swords, Trophy, UserRound, Zap } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useSession } from '@/components/auth/session-context'

const ITEMS = [
  { href: '/daily', key: 'daily' as const, icon: Headphones, developing: false },
  { href: '/plays', key: 'plays' as const, icon: Zap, developing: true },
  { href: '/online', key: 'online' as const, icon: Swords, developing: true },
  { href: '/leaderboard', key: 'leaderboard' as const, icon: Trophy, developing: false },
  { href: '/profile', key: 'profile' as const, icon: UserRound, developing: false },
]

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { user } = useSession()
  const asks = user?.incoming?.length ?? 0

  return (
    <nav
      aria-label={t.nav.main}
      className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-[#1e231c] bg-[#070807]/94 px-2 py-2.5 backdrop-blur-sm md:hidden"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative grid min-w-[56px] place-items-center gap-1 py-1 text-[11px] no-underline',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon size={16} />
            <span className="flex items-center gap-1">
              {t.nav[item.key]}
            </span>
            {item.developing ? <i className="nav-soon-dot is-corner" aria-label={t.nav.soon} /> : null}
            {item.key === 'profile' && asks > 0 ? (
              <i className="nav-hear-dot is-corner" aria-label={t.profile.friendRequests} />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
