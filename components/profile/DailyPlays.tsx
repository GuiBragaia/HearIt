'use client'

import { useEffect, useState } from 'react'
import { CLIP_LENGTHS, dailyKey } from '@/lib/game'
import { loadDayRun, type RecentRun } from '@/lib/db'
import type { DailyRun } from '@/lib/daily-run'
import { songById } from '@/lib/songs'
import { useSession } from '@/components/auth/session-context'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function playDayLabel(iso: string, today: string, locale: string) {
  if (iso === today) return null
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function clipOf(play: { duration: number; level: number }) {
  const fromLevel = CLIP_LENGTHS[play.level]
  const value = play.duration || fromLevel || 0
  return `${value}s`
}

export function DailyToday({ run }: { run: DailyRun | null }) {
  const { t } = useI18n()
  const state = !run ? 'open' : run.won ? 'hit' : 'miss'
  const copy =
    state === 'open' ? t.profile.dailyOpen : state === 'hit' ? t.profile.dailyHit : t.profile.dailyMiss
  return (
    <div className={cn('daily-chip', `is-${state}`)}>
      <span className={cn('profile-play-dot', state === 'hit' ? 'is-hit' : state === 'miss' ? 'is-miss' : '')} />
      <div>
        <p className="daily-chip-kicker">{t.profile.dailyToday}</p>
        <p className="daily-chip-copy">{copy}</p>
      </div>
      {run ? (
        <b className={run.won ? 'is-hit' : 'is-miss'}>{run.won ? `+${run.score}` : clipOf(run)}</b>
      ) : null}
    </div>
  )
}

export function DailyPlays({
  plays,
  empty,
  title,
}: {
  plays: RecentRun[]
  empty?: string
  title?: string
}) {
  const { t, locale } = useI18n()
  const { user } = useSession()
  const today = dailyKey()
  const [knowsToday, setKnowsToday] = useState(false)

  useEffect(() => {
    if (!user) {
      setKnowsToday(false)
      return
    }
    let live = true
    void loadDayRun(user.id).then((run) => {
      if (live) setKnowsToday(Boolean(run?.won))
    })
    return () => {
      live = false
    }
  }, [user])

  return (
    <div className="profile-panel-block">
      <div className="profile-panel-head">
        <h2>{title ?? t.profile.history}</h2>
      </div>
      {plays.length === 0 ? (
        <p className="profile-panel-empty">{empty ?? t.states.emptyPlays}</p>
      ) : (
        <ol className="profile-plays">
          {plays.map((play) => {
            const hideSong = play.day === today && !knowsToday
            const song = hideSong ? null : songById(play.songId)
            return (
              <li key={`${play.day}-${play.songId}`} className="profile-play">
                <span className={cn('profile-play-dot', play.won ? 'is-hit' : 'is-miss')} />
                <div>
                  <p className="profile-play-day">
                    {play.day === today ? t.profile.today : playDayLabel(play.day, today, locale)}
                  </p>
                  <p className="profile-play-title">{hideSong ? t.profile.dailyHidden : (song?.title ?? '—')}</p>
                  <p className="profile-play-meta">
                    <span>
                      {hideSong ? t.profile.dailyHiddenHint : song?.artist ?? ''}
                      {!hideSong && (play.duration || play.level) ? ` · ${clipOf(play)}` : ''}
                    </span>
                    <b className={play.won ? 'is-hit' : 'is-miss'}>
                      {play.won ? `${t.profile.hit} · +${play.score}` : t.profile.skip}
                    </b>
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}