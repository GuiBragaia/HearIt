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
        <section className="mx-auto w-full max-w-[720px] px-5 pb-20 pt-16">
          <p className="enter enter-1 m-0 text-xs text-muted-foreground">{t.auth.joinKicker}</p>
          <h1 className="enter enter-2 display mt-3 mb-0 text-[clamp(44px,9vw,80px)]">{t.profile.guestTitle}</h1>
          <p className="enter enter-3 mt-5 max-w-md text-lg text-muted-foreground">{t.profile.guestLead}</p>
          <p className="enter enter-4 mt-3 text-sm text-muted-foreground">{t.auth.dailyRule}</p>
          <div className="enter enter-5 mt-8 flex flex-wrap gap-3">
            <Link
              href="/join"
              className="land-play grid h-11 min-w-[140px] place-items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground no-underline"
            >
              {t.profile.join}
            </Link>
            <Link
              href="/daily"
              className="grid h-11 min-w-[140px] place-items-center rounded-md border border-[#3a4334] px-5 text-sm text-foreground no-underline"
            >
              {t.auth.playFree}
            </Link>
          </div>
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
