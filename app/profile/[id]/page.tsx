'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { FavoriteArtists, ProfileName, ProfilePhoto } from '@/components/profile/ProfileEdit'
import { FriendButton } from '@/components/profile/Friends'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { AchievementGrid } from '@/components/profile/AchievementGrid'
import { fetchPerson, fetchProfileByHandle } from '@/lib/db'
import { useSession } from '@/components/auth/session-context'
import { type Person } from '@/lib/people'
import { useI18n } from '@/lib/i18n'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function PublicProfilePage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { user } = useSession()
  const id = params.id ?? ''
  const [person, setPerson] = useState<Person | null | undefined>(undefined)

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

  const goBack = () => router.back()

  if (id === 'you') return null
  if (person === undefined) return <section className="mx-auto w-full max-w-[880px] px-5 pb-20 pt-8" />

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
    <section className="mx-auto w-full max-w-[880px] px-5 pb-20 pt-8">
      <button type="button" className="profile-back enter enter-1" onClick={goBack}>
        <ChevronLeft size={16} strokeWidth={2} />
        {t.profile.back}
      </button>
      <div className="profile-head enter enter-2">
        <ProfilePhoto
          photo={person.photo}
          initials={person.initials}
          viewer={{ name: person.name, handle: person.handle }}
        />
        <div className="min-w-0 flex-1">
          <ProfileName name={person.name} handle={person.handle} since={person.memberSince} />
          <FriendButton personId={person.id} />
        </div>
      </div>

      <ProfileStats stats={person.stats} />
      <FavoriteArtists value={person.favorites} />

      <div className="enter enter-6 mt-14">
        <AchievementGrid unlockedIds={person.unlocked} />
      </div>
    </section>
  )
}
