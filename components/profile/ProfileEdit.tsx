'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useSession } from '@/components/auth/session-context'
import { readPhotoFile, type PhotoDraft } from '@/lib/photo'
import { artistById, artistFromToken, artists, slugifyArtist } from '@/lib/artists'
import { OverlayPortal } from '@/components/overlay-portal'
import { pickOffensiveLine, useI18n } from '@/lib/i18n'
import { hasDisplayName, profileTitle } from '@/lib/session'
import { cn } from '@/lib/utils'
import { ArtistThumb } from './ArtistThumb'
import { Avatar } from './Avatar'
import { NameBadges } from './NameBadges'
import { PhotoCrop } from './PhotoCrop'
import { PhotoView } from './PhotoView'

export function ProfilePhoto({
  photo,
  initials,
  editable = false,
  size = 'md',
  viewer,
}: {
  photo?: string
  initials: string
  editable?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  viewer?: { name: string; handle: string }
}) {
  const { t } = useI18n()
  const { updateProfile } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<PhotoDraft | null>(null)
  const [looking, setLooking] = useState(false)
  const draftRef = useRef<PhotoDraft | null>(null)
  draftRef.current = draft

  const closeDraft = useCallback(() => {
    if (draftRef.current) URL.revokeObjectURL(draftRef.current.url)
    setDraft(null)
  }, [])

  const onFile = async (file?: File) => {
    if (!file) return
    try {
      setDraft(await readPhotoFile(file))
    } catch {
      /* keep current */
    }
  }

  if (!editable) {
    if (photo && viewer) {
      return (
        <>
          <button
            type="button"
            className="profile-photo-open"
            onClick={() => setLooking(true)}
            aria-label={t.profile.photoView}
          >
            <Avatar src={photo} initials={initials} size={size} />
          </button>
          <PhotoView
            open={looking}
            src={photo}
            name={viewer.name}
            handle={viewer.handle}
            onClose={() => setLooking(false)}
          />
        </>
      )
    }
    return <Avatar src={photo} initials={initials} size={size} />
  }

  return (
    <>
      <button
        type="button"
        className="profile-photo-btn"
        onClick={() => inputRef.current?.click()}
      >
        <Avatar src={photo} initials={initials} size={size} />
        <span className="profile-photo-label">{photo ? t.profile.photoChange : t.profile.photoAdd}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            void onFile(file)
          }}
        />
      </button>
      <PhotoCrop
        draft={draft}
        onCancel={closeDraft}
          onConfirm={(next) => {
            void updateProfile({ photo: next })
            closeDraft()
          }}
      />
    </>
  )
}

export function ProfileName({
  name,
  handle,
  since,
}: {
  name: string
  handle: string
  since: number
}) {
  const { t } = useI18n()
  const titled = profileTitle({ name, handle })
  const custom = hasDisplayName({ name, handle })

  return (
    <div className="profile-name">
      <div className="profile-title-row">
        <h1 className="profile-title">{titled}</h1>
        <NameBadges handle={handle} />
      </div>
      <p className="profile-name-meta">
        {custom ? (
          <>
            {handle}
            <span>/</span>
          </>
        ) : null}
        {t.profile.member} {since}
      </p>
    </div>
  )
}

export function ProfileCustomize({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { user, updateProfile } = useSession()
  const reduce = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [issue, setIssue] = useState<'display' | 'offensive' | null>(null)
  const [offensiveLine, setOffensiveLine] = useState('')

  useEffect(() => {
    if (!open) return
    setValue(user?.name ?? '')
    setIssue(null)
    setOffensiveLine('')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const id = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => {
      window.clearTimeout(id)
      document.body.style.overflow = prev
    }
  }, [open, user?.name])

  if (!user) return null

  const save = async () => {
    const next = value.trim().replace(/\s+/g, ' ')
    const result = await updateProfile({ name: next })
    if (result === 'display' || result === 'offensive') {
      setIssue(result)
      if (result === 'offensive') setOffensiveLine(pickOffensiveLine(t.auth.errorOffensive))
      return
    }
    onClose()
  }

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
        <motion.div
          key="customize"
          className="edit-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          onClick={save}
        >
          <motion.div
            className="edit-body"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="edit-kicker">{user.handle}</p>
            <h2 id="edit-title" className="edit-title">
              {t.profile.editTitle}
            </h2>
            <p className="edit-lead">{t.profile.editLead}</p>

            <ProfilePhoto photo={user.photo} initials={user.initials} editable size="xl" />

            <label className="edit-name">
              {t.auth.displayName}
              <input
                ref={inputRef}
                value={value}
                maxLength={24}
                placeholder={user.handle}
                aria-invalid={issue ? true : undefined}
                onChange={(event) => {
                  setIssue(null)
                  setValue(event.target.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    save()
                  }
                }}
              />
            </label>
            <p className={issue ? 'edit-hint is-bad' : 'edit-hint'}>
              {issue === 'offensive'
                ? offensiveLine
                : issue === 'display'
                  ? t.auth.errorDisplay
                  : t.auth.displayHint}
            </p>

            <button type="button" className="edit-done" onClick={save}>
              {t.profile.editDone}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}

export function FavoriteArtists({
  value,
  editable = false,
}: {
  value: string[]
  editable?: boolean
}) {
  const { t } = useI18n()
  const { updateProfile } = useSession()
  const [slot, setSlot] = useState<number | null>(null)
  const slots = [0, 1, 2] as const

  const setFavorite = (index: number, id: string | null) => {
    const favorites = slots.map((item) => (item === index ? (id ?? '') : (value[item] ?? ''))).filter(Boolean)
    void updateProfile({ favorites })
    setSlot(null)
  }

  return (
    <div className="profile-favs">
      <p className="profile-favs-kicker">{t.profile.favorites}</p>
      <ol className="fav-rank is-cards">
        {slots.map((index) => {
          const artist = artistById(value[index] ?? '')
          const place = index + 1
          if (!artist) {
            if (!editable) return null
            return (
              <li key={index}>
                <button type="button" className={cn('fav-slot is-empty', index === 0 && 'is-first')} onClick={() => setSlot(index)}>
                  <span className="fav-place">{place}</span>
                  <span className="artist-thumb">
                    <span className="artist-thumb-empty" />
                  </span>
                  <b>{t.profile.pickArtist}</b>
                </button>
              </li>
            )
          }
          const body = (
            <>
              <span className="fav-place">{place}</span>
              <ArtistThumb name={artist.name} />
              <b>{artist.name}</b>
            </>
          )
          return (
            <li key={artist.id}>
              {editable ? (
                <button type="button" className={cn('fav-slot', index === 0 && 'is-first')} onClick={() => setSlot(index)}>
                  {body}
                </button>
              ) : (
                <div className={cn('fav-slot', index === 0 && 'is-first')}>{body}</div>
              )}
            </li>
          )
        })}
      </ol>
      <ArtistPicker
        open={slot !== null}
        taken={value.filter((_, index) => index !== slot)}
        onClose={() => setSlot(null)}
        onPick={(id) => {
          if (slot === null) return
          setFavorite(slot, id)
        }}
        onClear={
          slot !== null && value[slot]
            ? () => setFavorite(slot, null)
            : undefined
        }
      />
    </div>
  )
}

type PickerHit = { id: string; name: string; artwork?: string | null }

function PickerThumb({ name, artwork }: { name: string; artwork?: string | null }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    setBroken(false)
  }, [artwork])
  if (!artwork || broken) return <ArtistThumb name={name} lazy />
  return (
    <span className="artist-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artwork}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
      <i aria-hidden />
    </span>
  )
}

function ArtistPicker({
  open,
  taken,
  onClose,
  onPick,
  onClear,
}: {
  open: boolean
  taken: string[]
  onClose: () => void
  onPick: (id: string) => void
  onClear?: () => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<PickerHit[]>([])
  const searchRef = useRef<HTMLInputElement>(null)
  const queryId = useRef(0)
  const takenIds = useMemo(
    () => new Set(taken.flatMap((token) => {
      const match = artistFromToken(token)
      return match ? [match.id, slugifyArtist(match.name)] : []
    })),
    [taken],
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      setRemote([])
      return
    }
    searchRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const id = (queryId.current += 1)
    const timer = window.setTimeout(
      () => {
        void fetch(`/api/artists?q=${encodeURIComponent(query.trim())}`)
          .then((response) => response.json())
          .then((data: { hits?: PickerHit[] }) => {
            if (id === queryId.current) setRemote(data.hits ?? [])
          })
          .catch(() => {})
      },
      query.trim().length < 2 ? 0 : 140,
    )
    return () => window.clearTimeout(timer)
  }, [open, query])

  const local = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return artists
      .filter((artist) => {
        if (takenIds.has(artist.id)) return false
        if (!needle) return true
        return artist.name.toLowerCase().includes(needle)
      })
      .map((artist): PickerHit => ({ id: artist.id, name: artist.name }))
  }, [query, takenIds])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const remoteFit = remote.filter((hit) => {
      const token = artistFromToken(hit.name)?.id ?? hit.id
      if (takenIds.has(token) || takenIds.has(hit.id)) return false
      if (!needle) return true
      return hit.name.toLowerCase().includes(needle)
    })
    return (remoteFit.length ? remoteFit : local).slice(0, 16)
  }, [local, remote, query, takenIds])

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
        <motion.div
          key="artists"
          className="artist-pick-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="artist-pick-title"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="artist-pick-body"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <p id="artist-pick-title" className="artist-pick-kicker">
              {t.profile.favorites}
            </p>
            <h2 className="artist-pick-title">{t.profile.pickArtist}</h2>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.profile.searchArtist}
              className="artist-pick-search"
            />
            <ul className="artist-pick-list">
              {filtered.map((artist) => (
                <li key={artist.id}>
                  <button type="button" onClick={() => onPick(artist.name)}>
                    <PickerThumb name={artist.name} artwork={artist.artwork} />
                    <span>{artist.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            {onClear ? (
              <button type="button" className="artist-pick-clear" onClick={onClear}>
                {t.profile.clearArtist}
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}
