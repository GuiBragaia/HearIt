'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export function LandingStory() {
  const { t } = useI18n()
  const steps = [
    { name: t.landing.stepHear, copy: t.landing.stepHearCopy },
    { name: t.landing.stepName, copy: t.landing.stepNameCopy },
    { name: t.landing.stepScore, copy: t.landing.stepScoreCopy },
  ]
  const faq = [
    { q: t.landing.faqWhat, a: t.landing.faqWhatA },
    { q: t.landing.faqHow, a: t.landing.faqHowA },
    { q: t.landing.faqFree, a: t.landing.faqFreeA },
    { q: t.landing.faqDaily, a: t.landing.faqDailyA },
  ]

  return (
    <section className="landing-story" aria-labelledby="landing-story-title">
      <div className="landing-story-inner">
        <p className="landing-story-kicker">{t.landing.storyKicker}</p>
        <h2 id="landing-story-title" className="display landing-story-title">
          {t.landing.storyTitle}
        </h2>
        <ol className="landing-story-steps">
          {steps.map((step) => (
            <li key={step.name}>
              <h3>{step.name}</h3>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>
        <h2 className="display landing-story-faq-title">{t.landing.faqTitle}</h2>
        <dl className="landing-story-faq">
          {faq.map((item) => (
            <div key={item.q}>
              <dt>{item.q}</dt>
              <dd>{item.a}</dd>
            </div>
          ))}
        </dl>
        <Link href="/daily" className="landing-story-go">
          {t.landing.daily}
        </Link>
      </div>
    </section>
  )
}
