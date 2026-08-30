'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { OverlayPortal } from '@/components/overlay-portal'
import { useI18n, type Locale } from '@/lib/i18n'

const EASE = [0.16, 1, 0.3, 1] as const
const SLIDE = 1.05

const VEIL: Record<Locale, { kicker: string; word: string }> = {
  en: { kicker: 'English', word: 'Hear.' },
  pt: { kicker: 'Português', word: 'Ouve.' },
}

export function LocaleVeil() {
  const { switching } = useI18n()
  const reduce = useReducedMotion()
  const copy = switching ? VEIL[switching] : null
  const dir = switching === 'pt' ? 1 : -1

  useEffect(() => {
    if (!switching) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [switching])

  return (
    <OverlayPortal>
      <AnimatePresence>
        {switching && copy && !reduce ? (
          <motion.div
            key={switching}
            className="locale-veil"
            data-dir={dir}
            initial={{ x: `${dir * -100}%` }}
            animate={{ x: '0%' }}
            exit={{ x: `${dir * 100}%` }}
            transition={{ duration: SLIDE, ease: EASE }}
            aria-hidden
          >
            <ViewportWaveform />
            <span className="locale-veil-wash" />
            <span className="locale-veil-bloom" />
            <span className="locale-veil-edge" />
            <LogoMark size={320} className="locale-veil-mark" />
            <motion.div
              className="locale-veil-stage"
              initial={{ opacity: 0, x: dir * -28, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.32, duration: 0.7, ease: EASE }}
            >
              <p className="locale-veil-kicker">{copy.kicker}</p>
              <p className="locale-veil-word">{copy.word}</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}
