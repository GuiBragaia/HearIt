'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { createIntroAudioContext, fadeIntroSound, playIntroSound } from '@/components/audio/intro-sound'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const
const HOLD_MS = 3400

const H_BARS = [
  { h: 72, w: 11 },
  { h: 58, w: 9 },
  { h: 22, w: 9 },
  { h: 32, w: 10 },
  { h: 22, w: 9 },
  { h: 58, w: 9 },
  { h: 72, w: 11 },
]

export const LandingIntro = forwardRef<HTMLDivElement, { onFinish: () => void }>(function LandingIntro(
  { onFinish },
  ref,
) {
  const { t } = useI18n()
  const [live, setLive] = useState(false)
  const done = useRef(false)
  const liveRef = useRef(false)
  const finishRef = useRef(onFinish)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  finishRef.current = onFinish

  const finish = () => {
    if (done.current) return
    done.current = true
    try {
      fadeIntroSound(masterRef.current, ctxRef.current)
    } catch {
      /* ignore */
    }
    finishRef.current()
  }

  const begin = () => {
    if (liveRef.current || done.current) return
    liveRef.current = true
    setLive(true)
    const ctx = ctxRef.current
    if (ctx?.state === 'running') {
      try {
        masterRef.current = playIntroSound(ctx, 0)
      } catch {
        /* visual still runs */
      }
    }
  }

  useEffect(() => {
    if (!live) return
    const timer = window.setTimeout(finish, HOLD_MS)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [live])

  useEffect(() => {
    const ctx = createIntroAudioContext()
    if (ctx) ctxRef.current = ctx

    const onGesture = (event: Event) => {
      if (liveRef.current || done.current) return
      if (event.type === 'keydown') {
        const key = (event as KeyboardEvent).key
        if (key !== 'Enter' && key !== ' ') return
        event.preventDefault()
      }
      if (!ctx) {
        begin()
        return
      }
      const pending = ctx.resume()
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        gain.gain.value = 0.0001
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
      } catch {
        /* still locked */
      }
      void pending.then(() => begin()).catch(() => begin())
    }

    if (ctx) {
      void ctx.resume().then(() => {
        if (done.current || liveRef.current) return
        if (ctx.state === 'running') begin()
      })
    }

    window.addEventListener('pointerdown', onGesture, { capture: true })
    window.addEventListener('keydown', onGesture, { capture: true })

    return () => {
      window.removeEventListener('pointerdown', onGesture, { capture: true })
      window.removeEventListener('keydown', onGesture, { capture: true })
      try {
        fadeIntroSound(masterRef.current, ctx)
      } catch {
        /* ignore */
      }
      window.setTimeout(() => {
        ctx?.close().catch(() => undefined)
      }, 240)
    }
  }, [])

  return (
    <motion.div
      ref={ref}
      className={cn('landing-intro', !live && 'is-wait')}
      role="dialog"
      aria-label={live ? t.landing.welcome : t.landing.listenCue}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.62, ease: EASE }}
    >
      <span className="landing-intro-grain" aria-hidden />
      <span className={cn('landing-intro-bloom', !live && 'is-wait')} aria-hidden />

      {live ? (
        <IntroLive onSkip={finish} skipLabel={t.landing.skip} welcome={t.landing.welcome} />
      ) : (
        <IntroWait cue={t.landing.listenCue} />
      )}
    </motion.div>
  )
})

LandingIntro.displayName = 'LandingIntro'

function IntroWait({ cue }: { cue: string }) {
  return (
    <div className="landing-intro-stage">
      <motion.div
        className="landing-intro-hi is-wait"
        aria-hidden
        initial={{ opacity: 0, y: 14, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.86, ease: EASE }}
      >
        <i className="is-i is-wait" style={{ width: 13, height: 72 }} />
      </motion.div>
      <motion.p
        className="landing-intro-word is-wait"
        initial={{ opacity: 0, y: 16, filter: 'blur(12px)' }}
        animate={{ opacity: 0.28, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.14, duration: 0.82, ease: EASE }}
      >
        hear <em>it</em>
      </motion.p>
      <motion.p
        className="landing-intro-cue"
        initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.32, duration: 0.78, ease: EASE }}
      >
        {cue}
      </motion.p>
    </div>
  )
}

function IntroLive({
  onSkip,
  skipLabel,
  welcome,
}: {
  onSkip: () => void
  skipLabel: string
  welcome: string
}) {
  return (
    <>
      <motion.span
        className="landing-intro-ring"
        aria-hidden
        initial={{ opacity: 0.45, scale: 0.28 }}
        animate={{ opacity: 0, scale: 1.85 }}
        transition={{ delay: 0.62, duration: 1.7, ease: EASE }}
      />
      <motion.span
        className="landing-intro-ring is-late"
        aria-hidden
        initial={{ opacity: 0.28, scale: 0.4 }}
        animate={{ opacity: 0, scale: 2.1 }}
        transition={{ delay: 1.05, duration: 1.8, ease: EASE }}
      />

      <div className="landing-intro-stage">
        <motion.p
          className="landing-intro-welcome"
          initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 1.12, duration: 0.72, ease: EASE }}
        >
          {welcome}
        </motion.p>

        <div className="landing-intro-hi" aria-hidden>
          <motion.span
            className="landing-intro-playhead"
            initial={{ left: '4%', opacity: 0 }}
            animate={{ left: '96%', opacity: [0, 1, 1, 0] }}
            transition={{ delay: 0.18, duration: 1.2, ease: EASE }}
          />
          {H_BARS.map((bar, index) => (
            <motion.i
              key={index}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.055, duration: 0.74, ease: EASE }}
              style={{ width: bar.w, height: bar.h }}
            />
          ))}
          <motion.i
            className="is-i"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: 0.56, duration: 0.82, ease: EASE }}
            style={{ width: 13, height: 72 }}
          />
        </div>

        <motion.span
          className="landing-intro-line"
          aria-hidden
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.92, duration: 0.7, ease: EASE }}
        />

        <motion.p
          className="landing-intro-word"
          initial={{ opacity: 0, y: 14, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 1.32, duration: 0.8, ease: EASE }}
        >
          hear <em>it</em>
        </motion.p>
      </div>

      <button
        type="button"
        className="landing-intro-skip"
        onPointerDown={(event) => {
          event.stopPropagation()
          onSkip()
        }}
        onClick={(event) => {
          event.stopPropagation()
          onSkip()
        }}
      >
        {skipLabel}
      </button>
    </>
  )
}
