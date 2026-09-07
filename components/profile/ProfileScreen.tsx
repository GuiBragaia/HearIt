'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FavoriteArtists, ProfileCustomize, ProfileName, ProfilePhoto } from '@/components/profile/ProfileEdit'
import { SavedTracks } from '@/components/profile/SavedTracks'
import { FriendsList } from '@/components/profile/Friends'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { AchievementGrid, ShownBadges } from '@/components/profile/AchievementGrid'
import { ProfileBanner } from '@/components/profile/ProfileBanner'
import { DailyPlays } from '@/components/profile/DailyPlays'
import { DeleteAccountConfirm } from '@/components/profile/DeleteAccountConfirm'
import { LogoutConfirm } from '@/components/auth/LogoutConfirm'
import { useSession } from '@/components/auth/session-context'
import { loadRecentRuns, type RecentRun } from '@/lib/db'
import { unlockedAchievements } from '@/lib/achievements'
import { HearLoading } from '@/components/states/HearLoading'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { useI18n } from '@/lib/i18n'

export function ProfileScreen() {
  const { t } = useI18n()
  const { user, ready, logout, updateProfile, deleteAccount } = useSession()
  const [leaving, setLeaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteFail, setDeleteFail] = useState(false)
  const [editing, setEditing] = useState(false)
  const [plays, setPlays] = useState<RecentRun[]>([])

  useEffect(() => {
    if (!user) {
      setPlays([])
      return
    }
    let live = true
    void loadRecentRuns(user.id, 5).then((rows) => {
      if (live) setPlays(rows)
    })
    return () => {
      live = false
    }
  }, [user])

  if (!ready) return <HearLoading />

  const since = user ? new Date(user.createdAt).getFullYear() : 0
  const unlocked = user ? unlockedAchievements(user.stats) : []

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
        <section className="profile-page has-banner">
          <div className="profile-hero enter enter-1">
            <div className="profile-hero-art">
              <ProfileBanner
                bannerUrl={user.banner}
                favoriteId={user.favorites[0]}
                editable
                onChange={(next) => {
                  void updateProfile({ banner: next })
                }}
                onClear={() => {
                  void updateProfile({ banner: '' })
                }}
              />
            </div>
            <div className="profile-head">
              <div className="profile-hero-face">
                <ProfilePhoto
                  photo={user.photo}
                  initials={user.initials}
                  size="lg"
                  viewer={{ name: user.name, handle: user.handle }}
                />
              </div>
              <div className="profile-head-copy">
                <ProfileName name={user.name} handle={user.handle} since={since} />
                <ShownBadges ids={user.shownBadges} unlocked={unlocked} />
                <button type="button" className="profile-edit" onClick={() => setEditing(true)}>
                  <i aria-hidden>
                    <span />
                    <span />
                    <span />
                  </i>
                  {t.profile.edit}
                </button>
              </div>
            </div>
          </div>

          <div className="profile-panel enter enter-3">
            <ProfileStats />
          </div>

          <div className="profile-pair">
            <div className="profile-panel enter enter-4">
              <FriendsList />
            </div>
            <div className="profile-panel enter enter-5">
              <FavoriteArtists value={user.favorites} editable />
            </div>
          </div>

          <div className="profile-panel enter enter-5">
            <SavedTracks value={user.savedTracks ?? []} editable />
          </div>

          <div className="profile-panel enter enter-6">
            <AchievementGrid shownBadges={user.shownBadges} editable />
          </div>

          <div className="profile-panel enter enter-7">
            <DailyPlays plays={plays} />
          </div>

          <div className="profile-foot">
            <button type="button" onClick={() => setLeaving(true)} className="auth-logout">
              {t.auth.logout}
            </button>
            <button type="button" className="profile-delete" onClick={() => setDeleting(true)}>
              {t.auth.deleteAccount}
            </button>
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
      {user ? (
        <DeleteAccountConfirm
          open={deleting}
          user={user}
          busy={deleteBusy}
          failed={deleteFail}
          onCancel={() => {
            setDeleting(false)
            setDeleteFail(false)
          }}
          onConfirm={() => {
            setDeleteBusy(true)
            void deleteAccount().then((ok) => {
              setDeleteBusy(false)
              if (ok) {
                setDeleting(false)
                return
              }
              setDeleteFail(true)
            })
          }}
        />
      ) : null}
    </>
  )
}