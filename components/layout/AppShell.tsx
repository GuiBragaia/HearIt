'use client'

import { usePathname } from 'next/navigation'
import { PlayingProvider, usePlaying } from './playing-context'
import { RouteMotionProvider } from './route-motion'
import { Header } from './Header'
import { LocaleVeil } from './LocaleVeil'
import { MobileNav } from './MobileNav'
import { cn } from '@/lib/utils'

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { playing, feel } = usePlaying()
  const isBare = pathname === '/' || pathname.startsWith('/auth/')

  return (
    <div
      className={cn(
        'app-root',
        !isBare && 'has-nav',
        playing && 'is-playing',
        feel === 'perfect' && 'is-perfect',
        feel === 'clutch' && 'is-clutch',
        (feel === 'hit' || feel === 'perfect' || feel === 'clutch') && 'is-hit',
        feel === 'miss' && 'is-miss',
      )}
    >
      <div className="atmosphere" aria-hidden />
      {!isBare ? <Header /> : null}
      <div className="app-main">{children}</div>
      {!isBare ? <MobileNav /> : null}
      <LocaleVeil />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PlayingProvider>
      <RouteMotionProvider>
        <ShellInner>{children}</ShellInner>
      </RouteMotionProvider>
    </PlayingProvider>
  )
}
