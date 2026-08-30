'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { OverlayPortal } from '@/components/overlay-portal'
import { hasSeenNonstopHello, markNonstopHelloSeen } from '@/lib/nonstop-hello'
import { useI18n } from '@/lib/i18n'

export function NonStopHello({ reopen = 0 }: { reopen?: number }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (hasSeenNonstopHello()) return
    const timer = window.setTimeout(() => setOpen(true), 420)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (reopen > 0) setOpen(true)
  }, [reopen])

  const dismiss = useCallback(() => {
    markNonstopHelloSeen()
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    layerRef.current?.scrollTo(0, 0)
    titleRef.current?.focus({ preventScroll: true })
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, dismiss])

  const delay = reduce ? 0 : 0.06

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="ns-hello"
            ref={layerRef}
            className="ns-hello"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ns-hello-title"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.32 }}
            onClick={dismiss}
          >
            <span className="ns-hello-glow" aria-hidden />
            <ViewportWaveform variant="horizon" />

            <motion.div
              className="ns-hello-card"
              initial={reduce ? false : { opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduce ? undefined : { opacity: 0, y: 8, filter: 'blur(6px)' }}
              transition={{ duration: 0.48, delay, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="ns-hello-kicker">{t.nonstop.helloKicker}</p>
              <h2 id="ns-hello-title" ref={titleRef} tabIndex={-1} className="ns-hello-title">
                {t.nonstop.helloTitle}
              </h2>
              <p className="ns-hello-lead">{t.nonstop.helloLead}</p>

              <p className="ns-hello-how">{t.nonstop.helloHow}</p>
              <ol className="ns-hello-steps">
                {t.nonstop.helloSteps.map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {step}
                  </li>
                ))}
              </ol>

              {t.nonstop.helloBeta.map((line) => (
                <p key={line} className="ns-hello-beta">
                  {line}
                </p>
              ))}

              <div className="ns-hello-thanks">
                <p className="ns-hello-thanks-kicker">{t.nonstop.helloThanksKicker}</p>
                <p className="ns-hello-who">{t.nonstop.helloWho}</p>
                {t.nonstop.helloThanks.map((line) => (
                  <p key={line} className="ns-hello-note">
                    {line}
                  </p>
                ))}
              </div>

              <Link href="/plays" onClick={dismiss} className="shine-btn ns-hello-cta">
                {t.nonstop.helloCta}
              </Link>
              <button type="button" onClick={dismiss} className="ns-hello-later">
                {t.nonstop.helloLater}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}
