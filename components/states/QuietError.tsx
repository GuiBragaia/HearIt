'use client'

import { Waveform } from '@/components/audio/Waveform'
import { useI18n } from '@/lib/i18n'

export function QuietError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()

  return (
    <section className="grid min-h-[50dvh] place-items-center px-5 text-center">
      <div className="w-full max-w-md">
        <p className="display m-0 text-4xl">{t.states.quiet}</p>
        <Waveform active={false} progress={0} />
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 h-11 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          {t.states.retry}
        </button>
      </div>
    </section>
  )
}
