'use client'

import Link from 'next/link'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { useI18n } from '@/lib/i18n'

export function NonStopGate() {
  const { t } = useI18n()

  return (
    <section className="developing-mode">
      <div className="developing-bg enter enter-2" aria-hidden>
        <ViewportWaveform />
      </div>
      <div className="developing-copy">
        <p className="enter enter-1 m-0 text-xs text-muted-foreground">{t.nav.plays}</p>
        <h1 className="enter enter-2 display mt-3 mb-0 text-[clamp(36px,7vw,56px)]">{t.nonstop.gateTitle}</h1>
        <p className="enter enter-3 mt-4 text-[15px] leading-6 text-muted-foreground">{t.nonstop.gateLead}</p>
        <p className="enter enter-4 mt-2 text-sm text-muted-foreground">{t.nonstop.gateDaily}</p>
        <div className="enter enter-5 mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/join?next=/plays"
            className="grid h-11 min-w-[140px] place-items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground no-underline"
          >
            {t.profile.join}
          </Link>
          <Link
            href="/login?next=/plays"
            className="grid h-11 min-w-[140px] place-items-center rounded-md border border-[#3a4334] px-5 text-sm text-foreground no-underline"
          >
            {t.auth.signIn}
          </Link>
        </div>
      </div>
    </section>
  )
}
