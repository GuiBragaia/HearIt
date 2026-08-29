'use client'

import { useState } from 'react'
import { LogoMark } from '@/components/layout/Logo'
import { formatDuration } from '@/lib/game'
import { dailyNumber } from '@/lib/songs'
import { useI18n } from '@/lib/i18n'

export function ShareCard({
  won,
  duration,
  score,
  onClose,
}: {
  won: boolean
  duration: number
  score: number
  onClose: () => void
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const lines = [
      `hear it #${dailyNumber()}`,
      won ? `${t.share.line} ${t.share.in} ${formatDuration(duration)}.` : t.share.fail,
      won ? `+${score}` : '',
      t.share.beat,
    ].filter(Boolean)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-[#050605]/80 p-5"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div className="flex flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
        <div className="share-square">
          <LogoMark size={28} />
          <p className="m-0 text-xs text-muted-foreground">hear it · #{dailyNumber()}</p>
          <p className="display m-0 text-[42px] leading-none text-foreground">
            {won ? formatDuration(duration) : '—'}
          </p>
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            {won ? (
              <>
                {t.share.line}
                <br />
                {t.share.in} {formatDuration(duration)}.
              </>
            ) : (
              t.share.fail
            )}
          </p>
          <p className="mono m-0 text-primary">{t.share.beat}</p>
        </div>
          <button type="button" onClick={copy} className="shine-btn h-11 min-w-[160px] rounded-md bg-primary text-sm font-medium text-primary-foreground">
          {copied ? t.share.copied : t.share.copy}
        </button>
        <button type="button" onClick={onClose} aria-label={t.close} className="border-0 bg-transparent text-xs text-muted-foreground">
          ×
        </button>
      </div>
    </div>
  )
}
