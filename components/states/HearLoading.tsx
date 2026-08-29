'use client'

import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function HearLoading({
  variant = 'page',
  title,
  lead,
}: {
  variant?: 'page' | 'block' | 'inline'
  title?: string
  lead?: string
}) {
  const { t } = useI18n()

  return (
    <div
      className={cn('hear-load', variant !== 'page' && `is-${variant}`)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="hear-load-core">
        <span className="hear-load-bloom" aria-hidden />
        <span className="hear-load-bars" aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <em />
          <i />
        </span>
        <p className="hear-load-title display">{title ?? t.states.wait}</p>
        <span className="hear-load-line" aria-hidden />
        <p className="hear-load-lead">{lead ?? t.states.waitLead}</p>
      </div>
    </div>
  )
}
