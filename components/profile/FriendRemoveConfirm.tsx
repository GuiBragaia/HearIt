'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { OverlayPortal } from '@/components/overlay-portal'
import { useI18n } from '@/lib/i18n'

export function FriendRemoveConfirm({
  open,
  kicker,
  onCancel,
  onConfirm,
}: {
  open: boolean
  kicker: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const stayRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    stayRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel])

  const delay = reduce ? 0 : 0.06

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
        <motion.div
          key="unfriend"
          className="logout-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unfriend-title"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.38 }}
          onClick={onCancel}
        >
          <span className="logout-glow" aria-hidden />
          <div className="result-mark" aria-hidden>
            <LogoMark size={220} />
          </div>
          <ViewportWaveform variant="horizon" />

          <motion.div
            className="logout-body"
            initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduce ? undefined : { opacity: 0, y: 10, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="logout-kicker">{kicker}</p>
            <h2 id="unfriend-title" className="logout-title">
              {t.profile.friendRemoveAsk}
            </h2>
            <p className="logout-lead">{t.profile.friendRemoveLead}</p>

            <button ref={stayRef} type="button" onClick={onCancel} className="shine-btn logout-stay">
              {t.profile.friendKeep}
            </button>
            <button type="button" onClick={onConfirm} className="logout-go">
              {t.profile.friendRemove}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}
