'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { OverlayPortal } from '@/components/overlay-portal'
import { useI18n } from '@/lib/i18n'
import { profileTitle } from '@/lib/session'

export function PhotoView({
  open,
  src,
  name,
  handle,
  onClose,
}: {
  open: boolean
  src: string
  name: string
  handle: string
  onClose: () => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const titled = profileTitle({ name, handle })

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
        <motion.div
          key="photo-look"
          className="photo-look-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-look-title"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="photo-look-body"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="photo-look-kicker">{handle}</p>
            <h2 id="photo-look-title" className="photo-look-title">
              {titled}
            </h2>
            <div className="photo-look-stage">
              <img src={src} alt="" className="photo-look-bloom" aria-hidden />
              <span className="photo-look-shot">
                <img src={src} alt={titled} />
                <i aria-hidden />
              </span>
            </div>
            <p className="photo-look-close">{t.close}</p>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}
