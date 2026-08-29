'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { UserPlus, UserCheck, UserMinus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useSession } from '@/components/auth/session-context'
import { Avatar } from '@/components/profile/Avatar'
import { FriendRemoveConfirm } from '@/components/profile/FriendRemoveConfirm'
import { friendStatus } from '@/lib/friends'
import { fetchPeople, fetchPerson, searchPeople } from '@/lib/db'
import { profileHref, type Person } from '@/lib/people'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const HEAR_HOLD = 640
const HEAR_FLASH = 1500
const GONE_HOLD = 1560

function FriendHear() {
  return (
    <span className="friend-hear" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <i key={index} />
      ))}
    </span>
  )
}

function FriendGone() {
  return (
    <span className="friend-gone" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <i key={index} />
      ))}
    </span>
  )
}

function FriendEar({ person, heard, gone }: { person: Person; heard?: boolean; gone?: boolean }) {
  return (
    <span className="friend-ear">
      <Avatar src={person.photo} initials={person.initials} size="sm" />
      {heard ? <FriendHear /> : null}
      {gone ? <FriendGone /> : null}
    </span>
  )
}

function useTimedFlag() {
  const [id, setId] = useState<string | null>(null)
  const hold = useRef(0)
  const extra = useRef(0)

  useEffect(
    () => () => {
      window.clearTimeout(hold.current)
      window.clearTimeout(extra.current)
    },
    [],
  )

  return { id, setId, hold, extra }
}

function useHearAccept() {
  const reduce = useReducedMotion()
  const { acceptFriend } = useSession()
  const flag = useTimedFlag()

  const hear = (next: string) => {
    if (flag.id) return
    if (reduce) {
      acceptFriend(next)
      return
    }
    flag.setId(next)
    flag.hold.current = window.setTimeout(() => acceptFriend(next), HEAR_HOLD)
    flag.extra.current = window.setTimeout(() => flag.setId((cur) => (cur === next ? null : cur)), HEAR_FLASH)
  }

  return { heard: flag.id, hear, reduce }
}

function useGoneRemove() {
  const reduce = useReducedMotion()
  const { removeFriend } = useSession()
  const flag = useTimedFlag()

  const fade = (next: string) => {
    if (flag.id) return
    if (reduce) {
      removeFriend(next)
      return
    }
    flag.setId(next)
    flag.hold.current = window.setTimeout(() => {
      removeFriend(next)
      flag.setId(null)
    }, GONE_HOLD)
  }

  return { gone: flag.id, fade }
}

function RemoveFriendButton({ person, onRemove }: { person: Person; onRemove: (id: string) => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="profile-edit is-off" onClick={() => setOpen(true)}>
        <UserMinus size={12} strokeWidth={2.2} />
        {t.profile.friendRemove}
      </button>
      <FriendRemoveConfirm
        open={open}
        kicker={person.handle}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false)
          onRemove(person.id)
        }}
      />
    </>
  )
}

export function FriendButton({ personId }: { personId: string }) {
  const { t } = useI18n()
  const { user, requestFriend, cancelRequest, declineFriend } = useSession()
  const { heard, hear } = useHearAccept()
  const { gone, fade } = useGoneRemove()
  const [person, setPerson] = useState<Person | null>(null)

  useEffect(() => {
    let live = true
    void fetchPerson(personId).then((next) => {
      if (live) setPerson(next)
    })
    return () => {
      live = false
    }
  }, [personId])

  if (!person) return null

  if (!user) {
    return (
      <Link href="/join" className="profile-edit">
        <UserPlus size={12} strokeWidth={2.2} />
        {t.profile.addFriend}
      </Link>
    )
  }

  const status = friendStatus(user, person.id)
  const hearing = heard === person.id
  const leaving = gone === person.id

  if (status === 'friends' || (hearing && status === 'incoming') || leaving) {
    return (
      <span className="profile-friend-actions">
        <span className="friend-ear is-action">
          <span className={cn('profile-edit is-on', hearing && 'is-hear', leaving && 'is-gone')}>
            <UserCheck size={12} strokeWidth={2.2} />
            {t.profile.friendsWith}
          </span>
          {hearing ? <FriendHear /> : null}
          {leaving ? <FriendGone /> : null}
        </span>
        {status === 'friends' && !leaving ? <RemoveFriendButton person={person} onRemove={fade} /> : null}
      </span>
    )
  }

  if (status === 'sent') {
    return (
      <button type="button" className="profile-edit is-wait" onClick={() => cancelRequest(person.id)}>
        {t.profile.friendSent}
      </button>
    )
  }

  if (status === 'incoming') {
    return (
      <span className="profile-friend-actions">
        <button type="button" className="profile-edit is-on" onClick={() => hear(person.id)}>
          {t.profile.friendAccept}
        </button>
        <button type="button" className="profile-ask-no" onClick={() => declineFriend(person.id)}>
          {t.profile.friendDecline}
        </button>
      </span>
    )
  }

  return (
    <button type="button" className="profile-edit" onClick={() => requestFriend(person.id)}>
      <UserPlus size={12} strokeWidth={2.2} />
      {t.profile.addFriend}
    </button>
  )
}

const rowSpring = { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }

export function FriendsList() {
  const { t } = useI18n()
  const { user, declineFriend, cancelRequest } = useSession()
  const { heard, hear, reduce } = useHearAccept()
  const { gone, fade } = useGoneRemove()
  const [friends, setFriends] = useState<Person[]>([])
  const [asks, setAsks] = useState<Person[]>([])
  const [sent, setSent] = useState<Person[]>([])
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<Person[]>([])
  const grouped = asks.length > 0 || sent.length > 0

  const friendKey = useMemo(
    () => `${(user?.friends ?? []).join(',')}|${(user?.incoming ?? []).join(',')}|${(user?.outgoing ?? []).join(',')}`,
    [user?.friends, user?.incoming, user?.outgoing],
  )

  useEffect(() => {
    if (!user) {
      setFriends([])
      setAsks([])
      setSent([])
      return
    }
    let live = true
    void Promise.all([fetchPeople(user.friends), fetchPeople(user.incoming), fetchPeople(user.outgoing)]).then(
      ([nextFriends, nextAsks, nextSent]) => {
        if (!live) return
        setFriends(nextFriends)
        setAsks(nextAsks)
        setSent(nextSent)
      },
    )
    return () => {
      live = false
    }
  }, [user, friendKey])

  useEffect(() => {
    const token = query.trim()
    if (token.length < 2) {
      setHits([])
      return
    }
    let live = true
    const timer = window.setTimeout(() => {
      void searchPeople(token, user?.id).then((rows) => {
        if (live) setHits(rows)
      })
    }, 220)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [query, user?.id])

  return (
    <div className="profile-friends">
      <p className="profile-friends-kicker">
        {t.profile.friends}
        {asks.length > 0 ? <i className="nav-hear-dot is-inline" aria-hidden /> : null}
        {friends.length > 0 ? <span>{friends.length}</span> : null}
      </p>

      <input
        className="friend-find"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.profile.findFriendPh}
        aria-label={t.profile.findFriend}
      />
      {hits.length > 0 ? (
        <ul className="profile-friends-list">
          {hits.map((person) => (
            <li key={person.id}>
              <div className="profile-friend is-ask">
                <Link href={profileHref(person.handle)} prefetch={false} className="profile-friend-id">
                  <Avatar src={person.photo} initials={person.initials} size="sm" />
                  <span className="min-w-0">
                    <strong>{person.name || person.handle}</strong>
                    <b>{person.handle}</b>
                  </span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {asks.length > 0 ? (
        <>
          <p className="profile-friends-sub">{t.profile.friendRequests}</p>
          <ul className="profile-friends-list">
            {asks.map((person) => {
              const hearing = heard === person.id
              return (
                <motion.li key={person.id} layout={!reduce} layoutId={reduce ? undefined : `ear-${person.id}`} transition={rowSpring}>
                  <div className={cn('profile-friend is-ask', hearing && 'is-hear')}>
                    <Link href={profileHref(person.handle)} prefetch={false} className="profile-friend-id">
                      <FriendEar person={person} heard={hearing} />
                      <span className="min-w-0">
                        <strong>{person.name}</strong>
                        <b>{hearing ? t.profile.friendsWith : t.profile.friendAsk}</b>
                      </span>
                    </Link>
                    {hearing ? (
                      <span className="profile-edit is-on is-hear">
                        <UserCheck size={12} strokeWidth={2.2} />
                        {t.profile.friendsWith}
                      </span>
                    ) : (
                      <span className="profile-friend-actions">
                        <button type="button" className="profile-ask-yes" onClick={() => hear(person.id)}>
                          {t.profile.friendAccept}
                        </button>
                        <button type="button" className="profile-ask-no" onClick={() => declineFriend(person.id)}>
                          {t.profile.friendDecline}
                        </button>
                      </span>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </>
      ) : null}

      {sent.length > 0 ? (
        <>
          <p className="profile-friends-sub">{t.profile.friendOutgoing}</p>
          <ul className="profile-friends-list">
            {sent.map((person) => (
              <li key={person.id}>
                <div className="profile-friend is-ask">
                  <Link href={profileHref(person.handle)} prefetch={false} className="profile-friend-id">
                    <Avatar src={person.photo} initials={person.initials} size="sm" />
                    <span className="min-w-0">
                      <strong>{person.name}</strong>
                      <b>{person.handle}</b>
                    </span>
                  </Link>
                  <button type="button" className="profile-edit is-wait" onClick={() => cancelRequest(person.id)}>
                    {t.profile.friendSent}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {friends.length === 0 && asks.length === 0 && sent.length === 0 ? (
        <p className="profile-friends-empty">{t.profile.friendsEmpty}</p>
      ) : friends.length > 0 ? (
        <>
          {grouped ? <p className="profile-friends-sub">{t.profile.friendsWith}</p> : null}
          <ul className="profile-friends-list">
            {friends.map((person) => {
              const hearing = heard === person.id
              const leaving = gone === person.id
              return (
                <motion.li key={person.id} layout={!reduce} layoutId={reduce ? undefined : `ear-${person.id}`} transition={rowSpring}>
                  <div className={cn('profile-friend is-ask', hearing && 'is-hear', leaving && 'is-gone')}>
                    <Link href={profileHref(person.handle)} prefetch={false} className="profile-friend-id">
                      <FriendEar person={person} gone={leaving} />
                      <span className="min-w-0">
                        <strong>{person.name}</strong>
                        <b>{leaving ? t.profile.friendGone : person.handle}</b>
                      </span>
                    </Link>
                    {leaving ? null : <RemoveFriendButton person={person} onRemove={fade} />}
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </>
      ) : null}
    </div>
  )
}
