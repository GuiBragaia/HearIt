'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FavoriteArtists, ProfileCustomize, ProfileName, ProfilePhoto } from '@/components/profile/ProfileEdit'
import { FriendsList } from '@/components/profile/Friends'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { AchievementGrid } from '@/components/profile/AchievementGrid'
import { LogoutConfirm } from '@/components/auth/LogoutConfirm'
import { useSession } from '@/components/auth/session-context'
import { loadRecentRuns } from '@/lib/db'
import { songById } from '@/lib/songs'
import { dailyKey } from '@/lib/game'
import { HearLoading } from '@/components/states/HearLoading'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
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

export function ProfileScreen() {
  const { t, locale } = useI18n()
  const { user, ready, logout } = useSession()
  const [leaving, setLeaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [plays, setPlays] = useState<Array<{ day: string; songId: string; won: boolean }>>([])

  useEffect(() => {
    if (!user) {
      setPlays([])
      return
    }
    let live = true
    void loadRecentRuns(user.id).then((rows) => {
      if (live) setPlays(rows)
    })
    return () => {
      live = false
    }
  }, [user])

  if (!ready) return <HearLoading />

  const since = user ? new Date(user.createdAt).getFullYear() : 0
  const today = dailyKey()

  return (
    <>
      {!user ? (
        <section className="play-hub">
          <div className="play-hub-mark" aria-hidden>
            <div className="play-hub-mark-inner">
              <i className="hero-mark-bloom" />
              <LogoMark size={460} className="hero-mark-ghost" />
              <LogoMark size={460} className="hero-mark-core" />
            </div>
          </div>

          <div className="play-hub-copy">
            <p className="enter enter-1 play-hub-kicker">{t.profile.guestKicker}</p>
            <h1 className="enter enter-2 display play-hub-title">{t.profile.guestTitle}</h1>
            <p className="enter enter-3 play-hub-lead">{t.profile.guestLead}</p>

            <nav className="enter enter-4 play-rooms is-pair" aria-label={t.nav.profile}>
              <Link href="/join?next=/profile" className="play-room is-live is-now">
                <span className="play-room-bars is-daily" aria-hidden>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <small>{t.profile.guestJoinHint}</small>
                <strong>{t.profile.join}</strong>
                <em>{t.profile.guestJoinCopy}</em>
              </Link>
              <Link href="/login?next=/profile" className="play-room is-live">
                <span className="play-room-bars is-plays" aria-hidden>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <em />
                  <i />
                </span>
                <small>{t.profile.guestLoginHint}</small>
                <strong>{t.auth.signIn}</strong>
                <em>{t.profile.guestLoginCopy}</em>
              </Link>
            </nav>

            <p className="enter enter-5 play-hub-meta">
              <Link href="/daily">{t.profile.guestDaily}</Link>
            </p>
          </div>

          <ViewportWaveform className="play-hub-wave" />
        </section>
      ) : (
        <section className="mx-auto w-full max-w-[880px] px-5 pb-20 pt-8">
          <div className="profile-head enter enter-1">
            <ProfilePhoto
              photo={user.photo}
              initials={user.initials}
              viewer={{ name: user.name, handle: user.handle }}
            />
            <div className="min-w-0 flex-1">
              <ProfileName name={user.name} handle={user.handle} since={since} />
              <button type="button" className="profile-edit" onClick={() => setEditing(true)}>
                <i aria-hidden>
                  <span />
                  <span />
                  <span />
                </i>
                {t.profile.edit}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLeaving(true)}
              className="auth-logout"
            >
              {t.auth.logout}
            </button>
          </div>

          <ProfileStats />
          <FriendsList />
          <FavoriteArtists value={user.favorites} editable />

          <div className="enter enter-6 mt-14">
            <AchievementGrid />
          </div>

          <div className="enter enter-7 mt-16">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="m-0 text-base font-medium tracking-tight">{t.profile.history}</h2>
            </div>
            {plays.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.states.emptyPlays}</p>
            ) : (
              <ol className="relative m-0 list-none border-l border-[#2a3126] p-0">
                {plays.map((play) => {
                  const song = songById(play.songId)
                  return (
                    <li key={`${play.day}-${play.songId}`} className="relative py-4 pl-6">
                      <span
                        className={cn(
                          'absolute top-[22px] left-[-4px] size-2',
                          play.won ? 'bg-primary' : 'bg-[#5a403c]',
                        )}
                      />
                      <p className="m-0 text-xs text-[#6d7568]">
                        {play.day === today ? t.profile.today : playDayLabel(play.day, today, locale)}
                      </p>
                      <p className="mt-1 mb-0 text-[15px] tracking-tight">{song?.title ?? play.songId}</p>
                      <p className="mt-1 mb-0 flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                        <span>{song?.artist ?? ''}</span>
                        <b className={cn('text-xs font-medium', play.won ? 'text-primary' : 'text-[#b07a74]')}>
                          {play.won ? t.profile.hit : t.profile.skip}
                        </b>
                      </p>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </section>
      )}

      <ProfileCustomize open={editing} onClose={() => setEditing(false)} />
      <LogoutConfirm
        open={leaving}
        onCancel={() => setLeaving(false)}
        onConfirm={() => {
          void logout()
          setLeaving(false)
        }}
      />
    </>
  )
}
