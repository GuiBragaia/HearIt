'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { Logo, LogoMark } from '@/components/layout/Logo'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { LandingIntro } from './LandingIntro'

export function LandingHero() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (reduce) setOpen(true)
  }, [reduce])

  const skipMotion = reduce === true
  const showIntro = !open && !skipMotion
  const revealed = open || skipMotion

  return (
    <section
      className={cn(
        'landing-hero relative flex min-h-dvh flex-col overflow-hidden px-6 pb-10',
        revealed && 'is-revealed',
      )}
    >
      <AnimatePresence>{showIntro ? <LandingIntro key="intro" onFinish={() => setOpen(true)} /> : null}</AnimatePresence>

      <div className="hero-mark enter enter-6" aria-hidden>
        <div className="hero-mark-inner">
          <i className="hero-mark-bloom" />
          <LogoMark size={480} className="hero-mark-ghost" />
          <LogoMark size={480} className="hero-mark-core" />
        </div>
      </div>
      <header className="enter enter-1 relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between py-7">
        <Logo />
        <LanguageSwitch />
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center pt-4">
        {t.landing.kicker ? (
          <p className="enter enter-2 m-0 text-sm text-muted-foreground">{t.landing.kicker}</p>
        ) : null}
        <h1 className="enter enter-3 display mt-5 mb-0 text-[clamp(40px,8.5vw,84px)]">
          {t.landing.h1a}
          <br />
          <em className="text-primary not-italic">{t.landing.h1b}</em>
        </h1>
        <p className="enter enter-4 mt-7 max-w-md text-[17px] leading-7 text-muted-foreground">{t.landing.support}</p>
        <div className="enter enter-5 mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/play"
            className="land-play grid h-11 min-w-[140px] place-items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground no-underline"
          >
            {t.landing.playNow}
          </Link>
          <Link
            href="/daily"
            className="land-daily grid h-11 min-w-[140px] place-items-center rounded-md border border-[#3a4334] px-5 text-sm text-foreground no-underline"
          >
            {t.landing.daily}
          </Link>
        </div>
      </div>

      <ViewportWaveform className="enter enter-6" />
    </section>
  )
}
