'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { OverlayPortal } from '@/components/overlay-portal'
import { useI18n } from '@/lib/i18n'

const EASE = [0.16, 1, 0.3, 1] as const

export function AuthOauthWait({
  open,
  provider,
  onCancel,
}: {
  open: boolean
  provider: 'apple' | 'google' | null
  onCancel: () => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const who = provider === 'apple' ? t.auth.oauthAppleKicker : t.auth.oauthGoogleKicker
  const lead = provider === 'apple' ? t.auth.oauthWaitApple : t.auth.oauthWaitGoogle

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open && provider ? (
          <motion.div
            key={`oauth-wait-${provider}`}
            className="hello-layer is-wait"
            role="status"
            aria-live="polite"
            aria-labelledby="oauth-wait-title"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <span className="hello-bloom" aria-hidden />
            <ViewportWaveform variant="horizon" />
            <div className="hello-mark" aria-hidden>
              <LogoMark size={220} />
            </div>
            <div className="hello-stage">
              <motion.p
                className="hello-kicker"
                initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {who}
              </motion.p>
              <h2 id="oauth-wait-title" className="hello-name">
                <motion.span
                  className="hello-name-in"
                  initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.08, duration: 0.62, ease: EASE }}
                >
                  {t.auth.oauthWaitTitle}
                </motion.span>
              </h2>
              <span className="hello-line hello-wait-line" aria-hidden />
              <motion.p
                className="hello-lead"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
              >
                {lead}
              </motion.p>
            </div>
            <button type="button" className="hello-skip" onClick={onCancel}>
              {t.auth.oauthCancel}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}
