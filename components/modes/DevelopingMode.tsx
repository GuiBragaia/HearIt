'use client'

import Link from 'next/link'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { useI18n } from '@/lib/i18n'

export function DevelopingMode({ mode }: { mode: 'plays' | 'online' }) {
  const { t } = useI18n()
  const title = mode === 'plays' ? t.developing.playsTitle : t.developing.onlineTitle
  const lead = mode === 'plays' ? t.developing.playsLead : t.developing.onlineLead

  return (
    <section className="developing-mode">
      <div className="developing-bg enter enter-2" aria-hidden>
        <ViewportWaveform />
      </div>
      <div className="developing-copy">
        <p className="enter enter-1 m-0 text-xs text-muted-foreground">{t.developing.badge}</p>
        <h1 className="enter enter-2 display mt-3 mb-0 text-[clamp(36px,7vw,56px)]">{title}</h1>
        <p className="enter enter-3 mt-4 text-[15px] leading-6 text-muted-foreground">{lead}</p>
        <p className="enter enter-4 mt-2 text-sm text-muted-foreground">{t.developing.note}</p>
        <Link
          href="/daily"
          className="enter enter-5 mt-7 grid h-11 w-fit min-w-[140px] place-items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground no-underline"
        >
          {t.developing.back}
        </Link>
      </div>
    </section>
  )
}
