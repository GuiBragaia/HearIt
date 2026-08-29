'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { OverlayPortal } from '@/components/overlay-portal'
import { useI18n } from '@/lib/i18n'

const EASE = [0.16, 1, 0.3, 1] as const
const JOIN_MS = 3200
const LOGIN_MS = 2500
const REDUCE_MS = 1100
const FADE_MS = 480

export type AuthHelloKind = 'join' | 'login'

export function AuthHello({
  open,
  kind,
  name,
  handle,
  onDone,
}: {
  open: boolean
  kind: AuthHelloKind
  name: string
  handle?: string
  onDone: () => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const [leaving, setLeaving] = useState(false)
  const done = useRef(false)
  const leavingRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const finish = () => {
    if (done.current || leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)
  }

  useEffect(() => {
    if (!open) {
      done.current = false
      leavingRef.current = false
      setLeaving(false)
      return
    }
    done.current = false
    leavingRef.current = false
    setLeaving(false)
    const hold = reduce ? REDUCE_MS : kind === 'join' ? JOIN_MS : LOGIN_MS
    const timer = window.setTimeout(finish, hold)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        finish()
      }
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, kind, reduce])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => {
      if (done.current) return
      done.current = true
      onDoneRef.current()
    }, FADE_MS)
    return () => window.clearTimeout(timer)
  }, [leaving])

  const kicker = kind === 'join' ? t.auth.helloJoinKicker : t.auth.helloLoginKicker
  const lead = kind === 'join' ? t.auth.helloJoinLead : t.auth.helloLoginLead
  const showHandle = kind === 'join' && handle && handle !== name

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
          <motion.div
            key={`hello-${kind}`}
            className={kind === 'join' ? 'hello-layer is-join' : 'hello-layer is-login'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hello-title"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: leaving ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_MS / 1000, ease: EASE }}
          >
            <span className="hello-bloom" aria-hidden />
            {kind === 'join' ? (
              <>
                <motion.span
                  className="hello-ring"
                  aria-hidden
                  initial={reduce ? false : { opacity: 0.5, scale: 0.22 }}
                  animate={{ opacity: 0, scale: 1.9 }}
                  transition={{ delay: 0.18, duration: 1.7, ease: EASE }}
                />
                <motion.span
                  className="hello-ring is-late"
                  aria-hidden
                  initial={reduce ? false : { opacity: 0.28, scale: 0.36 }}
                  animate={{ opacity: 0, scale: 2.15 }}
                  transition={{ delay: 0.52, duration: 1.85, ease: EASE }}
                />
              </>
            ) : (
              <ViewportWaveform variant="horizon" />
            )}
            <div className="hello-mark" aria-hidden>
              <LogoMark size={kind === 'join' ? 280 : 220} />
            </div>

            <div className="hello-stage">
              <motion.p
                className="hello-kicker"
                initial={reduce ? false : { opacity: 0, y: 12, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.62, ease: EASE }}
              >
                {kicker}
              </motion.p>

              <h2 id="hello-title" className="hello-name">
                {reduce ? (
                  <HelloPlain name={name} />
                ) : kind === 'join' ? (
                  <HelloLetters name={name} />
                ) : (
                  <HelloSoft name={name} />
                )}
              </h2>

              {showHandle ? (
                <motion.p
                  className="hello-handle"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.72, duration: 0.5, ease: EASE }}
                >
                  {handle}
                </motion.p>
              ) : null}

              <motion.span
                className="hello-line"
                aria-hidden
                initial={reduce ? false : { scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.88, duration: 0.62, ease: EASE }}
              />

              <motion.p
                className="hello-lead"
                initial={reduce ? false : { opacity: 0, y: 12, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: reduce ? 0 : 1.05, duration: 0.62, ease: EASE }}
              >
                {lead}
              </motion.p>
            </div>

            <button
              type="button"
              className="hello-skip"
              onClick={(event) => {
                event.stopPropagation()
                finish()
              }}
            >
              {t.auth.helloSkip}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}

function HelloPlain({ name }: { name: string }) {
  if (name.startsWith('@')) {
    return (
      <>
        <em>@</em>
        {name.slice(1)}
      </>
    )
  }
  return name
}

function HelloSoft({ name }: { name: string }) {
  return (
    <motion.span
      className="hello-name-in"
      initial={{ opacity: 0, y: 16, filter: 'blur(12px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: 0.18, duration: 0.78, ease: EASE }}
    >
      <HelloPlain name={name} />
    </motion.span>
  )
}

function HelloLetters({ name }: { name: string }) {
  const chars = Array.from(name)
  return (
    <span className="hello-name-in">
      {chars.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.22 + index * 0.032, duration: 0.52, ease: EASE }}
        >
          {char === ' ' ? '\u00a0' : char === '@' ? <em>@</em> : char}
        </motion.span>
      ))}
    </span>
  )
}
