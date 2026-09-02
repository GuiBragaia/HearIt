'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { SettingsMenu } from './SettingsMenu'
import { Logo } from './Logo'
import { NAV_ITEMS } from './nav'
import { useSession } from '@/components/auth/session-context'

export function Header() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { user, ready } = useSession()
  const asks = user?.incoming?.length ?? 0

  return (
    <header className="mx-auto flex h-[72px] w-full max-w-[1120px] items-center justify-between px-5">
      <Logo />
      <nav className="hidden items-center gap-1 md:flex" aria-label={t.nav.main}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative px-3 py-2 text-[13px] no-underline',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span className="relative inline-block">
                {t.nav[item.key]}
                {item.developing ? <i className="nav-soon-dot" aria-label={t.nav.soon} /> : null}
                {item.key === 'profile' && asks > 0 ? (
                  <i className="nav-hear-dot" aria-label={t.profile.friendRequests} />
                ) : null}
              </span>
              {active ? <span className="absolute inset-x-3 bottom-0 h-px bg-primary" /> : null}
            </Link>
          )
        })}
      </nav>
      <div className="flex items-center gap-3">
        {ready && !user && pathname !== '/join' && pathname !== '/login' ? (
          <Link href="/join" className="hidden text-[13px] text-muted-foreground no-underline md:inline">
            {t.nav.join}
          </Link>
        ) : null}
        <SettingsMenu />
      </div>
    </header>
  )
}
