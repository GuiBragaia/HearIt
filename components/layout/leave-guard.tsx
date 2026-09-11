'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { OverlayPortal } from '@/components/overlay-portal'
import { useI18n } from '@/lib/i18n'

type PendingLeave = { href: string } | { back: true }

const LeaveGuardContext = createContext<{
  arm: () => void
  disarm: () => void
}>({
  arm: () => undefined,
  disarm: () => undefined,
})

function samePlace(url: URL, pathname: string) {
  return url.pathname === pathname && url.search === window.location.search
}

export function LeaveGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const [armed, setArmed] = useState(false)
  const [pending, setPending] = useState<PendingLeave | null>(null)
  const armedRef = useRef(false)
  const allowRef = useRef(false)

  armedRef.current = armed

  const arm = useCallback(() => {
    allowRef.current = false
    setArmed(true)
  }, [])

  const disarm = useCallback(() => {
    allowRef.current = true
    setPending(null)
    setArmed(false)
  }, [])

  useEffect(() => {
    if (!armed) return

    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const onClick = (event: MouseEvent) => {
      if (!armedRef.current || allowRef.current) return
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const node = event.target
      if (!(node instanceof Element)) return
      const link = node.closest('a[href]')
      if (!(link instanceof HTMLAnchorElement)) return
      if (link.target === '_blank' || link.hasAttribute('download')) return
      const href = link.getAttribute('href')
      if (!href || /^(mailto:|tel:|javascript:)/i.test(href)) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (samePlace(url, pathname)) return
      event.preventDefault()
      event.stopPropagation()
      setPending({ href: `${url.pathname}${url.search}${url.hash}` })
    }

    if (window.history.state?.__hearNs !== 1) {
      window.history.pushState({ __hearNs: 1 }, '', window.location.href)
    }

    const onPop = () => {
      if (allowRef.current || !armedRef.current) return
      window.history.pushState({ __hearNs: 1 }, '', window.location.href)
      setPending({ back: true })
    }

    window.addEventListener('beforeunload', onUnload)
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPop)
    }
  }, [armed, pathname])

  const stay = useCallback(() => setPending(null), [])

  const leave = useCallback(() => {
    const next = pending
    allowRef.current = true
    setArmed(false)
    setPending(null)
    if (!next) return
    if ('back' in next) {
      window.history.go(-2)
      return
    }
    router.push(next.href)
  }, [pending, router])

  return (
    <LeaveGuardContext.Provider value={{ arm, disarm }}>
      {children}
      <SessionLeaveConfirm open={Boolean(pending)} onStay={stay} onLeave={leave} />
    </LeaveGuardContext.Provider>
  )
}

export function useSessionLeaveGuard(active: boolean) {
  const { arm, disarm } = useContext(LeaveGuardContext)
  useEffect(() => {
    if (!active) return
    arm()
    return disarm
  }, [active, arm, disarm])
}

function SessionLeaveConfirm({
  open,
  onStay,
  onLeave,
}: {
  open: boolean
  onStay: () => void
  onLeave: () => void
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
      if (event.key === 'Escape') onStay()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onStay])

  const delay = reduce ? 0 : 0.06

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="ns-leave"
            className="logout-layer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ns-leave-title"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.38 }}
            onClick={onStay}
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
              <p className="logout-kicker">{t.nav.plays}</p>
              <h2 id="ns-leave-title" className="logout-title">
                {t.nonstop.leaveAsk}
              </h2>
              <p className="logout-lead">{t.nonstop.leaveLead}</p>

              <button ref={stayRef} type="button" onClick={onStay} className="shine-btn logout-stay">
                {t.nonstop.leaveStay}
              </button>
              <button type="button" onClick={onLeave} className="logout-go">
                {t.nonstop.leaveGo}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}
