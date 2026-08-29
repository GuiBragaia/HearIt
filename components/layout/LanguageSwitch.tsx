'use client'

import { useI18n, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n()
  const options: Locale[] = ['en', 'pt']

  return (
    <div className="flex items-center gap-0.5 text-xs text-muted-foreground" role="group" aria-label={t.language}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          className={cn(
            'border-0 bg-transparent px-1.5 py-1',
            locale === option ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {t.lang[option]}
        </button>
      ))}
    </div>
  )
}
