'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SessionProvider } from '@/components/auth/session-context'
import { I18nProvider } from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SessionProvider>
        <AppShell>{children}</AppShell>
      </SessionProvider>
    </I18nProvider>
  )
}
