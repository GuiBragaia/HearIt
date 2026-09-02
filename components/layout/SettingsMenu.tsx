'use client'

import Link from 'next/link'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Settings, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useSession } from '@/components/auth/session-context'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { OverlayPortal } from '@/components/overlay-portal'
import {
  FEEDBACK_MAX_CHARS,
  FEEDBACK_MIN_CHARS,
  FEEDBACK_MIN_POINTS,
  submitFeedback,
  type FeedbackError,
  type FeedbackKind,
} from '@/lib/feedback'
import { useI18n } from '@/lib/i18n'
import { bootSettings, getSettings, setSettings, subscribeSettings, type HearSettings } from '@/lib/settings'
import { cn, formatNumber } from '@/lib/utils'

function useHearSettings() {
  const [value, setValue] = useState<HearSettings>(() => getSettings())

  useEffect(() => {
    setValue(bootSettings())
    return subscribeSettings(setValue)
  }, [])

  return value
}

function feedbackCopy(error: FeedbackError | 'sent' | null, t: ReturnType<typeof useI18n>['t']) {
  if (error === 'sent') return t.settings.feedbackSent
  if (error === 'body') return t.settings.feedbackShort
  if (error === 'rate') return t.settings.feedbackRate
  if (error === 'points' || error === 'auth') return t.settings.feedbackNeed
  if (error === 'fail' || error === 'config') return t.settings.feedbackFail
  return null
}

function FeedbackBox({ onJoin }: { onJoin: () => void }) {
  const { t, locale } = useI18n()
  const { user } = useSession()
  const [kind, setKind] = useState<FeedbackKind>('note')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [flash, setFlash] = useState<FeedbackError | 'sent' | null>(null)
  const points = user?.stats.points ?? 0
  const eligible = Boolean(user) && points >= FEEDBACK_MIN_POINTS
  const trimmed = body.trim()
  const ready = trimmed.length >= FEEDBACK_MIN_CHARS && trimmed.length <= FEEDBACK_MAX_CHARS
  const note = feedbackCopy(flash, t)

  useEffect(() => {
    if (flash !== 'sent') return
    const timer = window.setTimeout(() => setFlash(null), 2600)
    return () => window.clearTimeout(timer)
  }, [flash])

  const send = async () => {
    if (sending) return
    if (!ready) {
      setFlash('body')
      return
    }
    setSending(true)
    const error = await submitFeedback(kind, body)
    setSending(false)
    if (error) {
      setFlash(error)
      return
    }
    setBody('')
    setFlash('sent')
  }

  return (
    <div className="settings-feedback">
      <div className="settings-feedback-head">
        <span>
          {t.settings.feedback}
          <small>{t.settings.feedbackHint}</small>
        </span>
        {eligible ? (
          <div className="settings-toggle" role="group" aria-label={t.settings.feedback}>
            <button type="button" className={cn(kind === 'note' && 'is-on')} onClick={() => setKind('note')}>
              {t.settings.feedbackNote}
            </button>
            <button type="button" className={cn(kind === 'idea' && 'is-on')} onClick={() => setKind('idea')}>
              {t.settings.feedbackIdea}
            </button>
          </div>
        ) : null}
      </div>

      {eligible ? (
        <>
          <textarea
            className="settings-feedback-input"
            rows={4}
            maxLength={FEEDBACK_MAX_CHARS}
            value={body}
            placeholder={t.settings.feedbackPh}
            aria-label={t.settings.feedback}
            onChange={(event) => {
              setBody(event.target.value)
              if (flash && flash !== 'sent') setFlash(null)
            }}
          />
          <div className="settings-feedback-foot">
            <p
              className={cn(
                'settings-feedback-note',
                flash === 'sent' && 'is-ok',
                flash && flash !== 'sent' && 'is-bad',
              )}
            >
              {note ?? '\u00a0'}
            </p>
            <button type="button" className="settings-feedback-send" disabled={sending} onClick={() => void send()}>
              {sending ? t.settings.feedbackSending : t.settings.feedbackSend}
            </button>
          </div>
        </>
      ) : (
        <p className="settings-feedback-lock">
          {user ? (
            <>
              {t.settings.feedbackNeed}
              <small>
                {formatNumber(points, locale)} / {formatNumber(FEEDBACK_MIN_POINTS, locale)}
              </small>
            </>
          ) : (
            <>
              {t.settings.feedbackNeedGuest}{' '}
              <Link href="/join" className="settings-feedback-link" onClick={onJoin}>
                {t.nav.join}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}

export function SettingsMenu() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const settings = useHearSettings()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const wrap = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const muted = settings.volume <= 0.001

  useLayoutEffect(() => {
    if (!open || !wrap.current) return
    const place = () => {
      const box = wrap.current?.getBoundingClientRect()
      if (!box) return
      setPos({ top: box.bottom + 10, right: window.innerWidth - box.right })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const node = event.target as Node
      if (wrap.current?.contains(node) || panel.current?.contains(node)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={cn('settings', open && 'is-open')} ref={wrap}>
      <button
        type="button"
        className="settings-gear"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={t.settings.open}
        onClick={() => setOpen((value) => !value)}
      >
        <Settings size={16} strokeWidth={1.8} />
      </button>
      <OverlayPortal>
        <AnimatePresence>
          {open ? (
            <motion.div
              key="settings-panel"
              ref={panel}
              className="settings-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              style={{ top: pos.top, right: pos.right }}
              initial={reduce ? false : { opacity: 0, y: 8, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduce ? undefined : { opacity: 0, y: 6, filter: 'blur(6px)' }}
              transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <p id={titleId} className="settings-kicker">
                {t.settings.title}
              </p>

              <div className="settings-row">
                <span>{t.settings.language}</span>
                <LanguageSwitch />
              </div>

              <div className="settings-row">
                <span>{t.settings.volume}</span>
                <div className="settings-volume">
                  <button
                    type="button"
                    className="settings-mute"
                    aria-label={muted ? t.settings.unmute : t.settings.mute}
                    onClick={() => setSettings({ volume: muted ? 0.85 : 0 })}
                  >
                    {muted ? <VolumeX size={14} strokeWidth={2} /> : <Volume2 size={14} strokeWidth={2} />}
                  </button>
                  <input
                    className="settings-range"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(settings.volume * 100)}
                    aria-label={t.settings.volume}
                    style={{ ['--fill' as string]: `${Math.round(settings.volume * 100)}%` }}
                    onChange={(event) => setSettings({ volume: Number(event.target.value) / 100 })}
                  />
                </div>
              </div>

              <div className="settings-row">
                <span>
                  {t.settings.autoplay}
                  <small>{t.settings.autoplayHint}</small>
                </span>
                <div className="settings-toggle" role="group" aria-label={t.settings.autoplay}>
                  <button
                    type="button"
                    className={cn(!settings.autoplay && 'is-on')}
                    onClick={() => setSettings({ autoplay: false })}
                  >
                    {t.settings.off}
                  </button>
                  <button
                    type="button"
                    className={cn(settings.autoplay && 'is-on')}
                    onClick={() => setSettings({ autoplay: true })}
                  >
                    {t.settings.on}
                  </button>
                </div>
              </div>

              <FeedbackBox onJoin={() => setOpen(false)} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </OverlayPortal>
    </div>
  )
}
