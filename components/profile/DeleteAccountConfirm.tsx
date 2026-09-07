'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { OverlayPortal } from '@/components/overlay-portal'
import { profileTitle, usernameFromHandle } from '@/lib/session'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function sameName(typed: string, user: { name: string; handle: string }) {
  const token = typed.trim().toLowerCase().replace(/^@/, '')
  if (!token) return false
  const handle = usernameFromHandle(user.handle)
  const name = profileTitle(user).trim().toLowerCase()
  return token === handle || token === name
}

export function DeleteAccountConfirm({
  open,
  user,
  busy,
  failed,
  onCancel,
  onConfirm,
}: {
  open: boolean
  user: { name: string; handle: string }
  busy?: boolean
  failed?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState('')
  const match = sameName(typed, user)

  useEffect(() => {
    if (!open) {
      setTyped('')
      return
    }
    inputRef.current?.focus()
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
            key="delete-account"
            className="logout-layer is-delete"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
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
              <p className="logout-kicker">{t.auth.deleteKicker}</p>
              <h2 id="delete-title" className="logout-title">
                {t.auth.deleteAsk}
              </h2>
              <p className="logout-lead">{t.auth.deleteLead}</p>
              <p className="logout-hint">{t.auth.deleteHint}</p>
              <input
                ref={inputRef}
                className="logout-name"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={t.auth.deletePh}
                autoComplete="off"
                spellCheck={false}
                aria-label={t.auth.deleteHint}
              />
              {typed && !match ? <p className="logout-miss">{t.auth.deleteMismatch}</p> : null}
              {failed ? <p className="logout-miss">{t.auth.deleteFail}</p> : null}

              <button type="button" onClick={onCancel} className="shine-btn logout-stay">
                {t.auth.deleteStay}
              </button>
              <button
                type="button"
                className={cn('logout-go', !match && 'is-off')}
                disabled={!match || busy}
                onClick={onConfirm}
              >
                {busy ? t.auth.deleteGoing : t.auth.deleteGo}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}