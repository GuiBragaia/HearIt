'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { FavoriteArtists, ProfileName, ProfilePhoto } from '@/components/profile/ProfileEdit'
import { FriendButton } from '@/components/profile/Friends'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { AchievementGrid, ShownBadges } from '@/components/profile/AchievementGrid'
import { ProfileBanner } from '@/components/profile/ProfileBanner'
import { DailyPlays, DailyToday } from '@/components/profile/DailyPlays'
import { fetchPerson, fetchProfileByHandle, loadDayRun, loadRecentRuns, type RecentRun } from '@/lib/db'
import { useSession } from '@/components/auth/session-context'
import { type Person } from '@/lib/people'
import type { DailyRun } from '@/lib/daily-run'
import { HearLoading } from '@/components/states/HearLoading'
import { useI18n } from '@/lib/i18n'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function PublicProfile() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { user } = useSession()
  const id = params.id ?? ''
  const [person, setPerson] = useState<Person | null | undefined>(undefined)
  const [today, setToday] = useState<DailyRun | null>(null)
  const [plays, setPlays] = useState<RecentRun[]>([])
  const [dailyReady, setDailyReady] = useState(false)

  useEffect(() => {
    if (id === 'you' || (user && (id === user.id || id === user.handle.replace(/^@/, '')))) {
      router.replace('/profile')
      return
    }
    let live = true
    const load = UUID.test(id) ? fetchPerson(id) : fetchProfileByHandle(id)
    void load.then((next) => {
      if (live) setPerson(next)
    })
    return () => {
      live = false
    }
  }, [id, user, router])

  useEffect(() => {
    if (!person) {
      setToday(null)
      setPlays([])
      setDailyReady(false)
      return
    }
    let live = true
    setDailyReady(false)
    void Promise.all([loadDayRun(person.id), loadRecentRuns(person.id, 3)]).then(([day, rows]) => {
      if (!live) return
      setToday(day)
      setPlays(rows)
      setDailyReady(true)
    })
    return () => {
      live = false
    }
  }, [person])

  const goBack = () => router.back()

  if (id === 'you') return null
  if (person === undefined) return <HearLoading />

  if (!person) {
    return (
      <section className="mx-auto w-full max-w-[720px] px-5 pb-20 pt-16">
        <button type="button" className="profile-back" onClick={goBack}>
          <ChevronLeft size={16} strokeWidth={2} />
          {t.profile.back}
        </button>
        <h1 className="display mt-6 mb-0 text-[clamp(40px,8vw,72px)]">{t.profile.missing}</h1>
        <Link href="/leaderboard" className="mt-8 inline-block text-sm text-muted-foreground">
          {t.profile.backBoard}
        </Link>
      </section>
    )
  }

  return (
    <section className="profile-page has-banner">
      <div className="profile-hero enter enter-1">
        <div className="profile-hero-art">
          <button type="button" className="profile-back is-over" onClick={goBack}>
            <ChevronLeft size={16} strokeWidth={2} />
            {t.profile.back}
          </button>
          <ProfileBanner bannerUrl={person.banner} favoriteId={person.favorites[0]} />
        </div>
        <div className="profile-head">
          <div className="profile-hero-face">
            <ProfilePhoto
              photo={person.photo}
              initials={person.initials}
              size="lg"
              viewer={{ name: person.name, handle: person.handle }}
            />
          </div>
          <div className="profile-head-copy">
            <ProfileName name={person.name} handle={person.handle} since={person.memberSince} />
            <ShownBadges ids={person.shownBadges} unlocked={person.unlocked} />
            <FriendButton personId={person.id} />
          </div>
        </div>
      </div>

      <div className="profile-panel enter enter-3">
        <ProfileStats stats={person.stats} />
      </div>

      {dailyReady ? (
        <div className="profile-panel enter enter-4">
          <DailyToday run={today} />
          <div className="profile-daily-gap">
            <DailyPlays plays={plays} empty={t.states.emptyPlaysOther} title={t.profile.historyOther} />
          </div>
        </div>
      ) : null}

      <div className="profile-panel enter enter-4">
        <FavoriteArtists value={person.favorites} />
      </div>

      <div className="profile-panel enter enter-5">
        <AchievementGrid unlockedIds={person.unlocked} shownBadges={person.shownBadges} />
      </div>
    </section>
  )
}