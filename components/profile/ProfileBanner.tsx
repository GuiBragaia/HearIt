'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { artistById } from '@/lib/artists'
import { resolveArtistArt } from '@/lib/artist-art'
import { readPhotoFile, type PhotoDraft } from '@/lib/photo'
import { PhotoCrop } from './PhotoCrop'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function ProfileBanner({
  bannerUrl,
  favoriteId,
  editable = false,
  onChange,
  onClear,
}: {
  bannerUrl?: string
  favoriteId?: string
  editable?: boolean
  onChange?: (dataUrl: string) => void
  onClear?: () => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [art, setArt] = useState<string | null>(null)
  const [draft, setDraft] = useState<PhotoDraft | null>(null)
  const draftRef = useRef<PhotoDraft | null>(null)
  const custom = Boolean(bannerUrl)
  const src = bannerUrl || art || undefined
  draftRef.current = draft

  useEffect(() => {
    if (bannerUrl) {
      setArt(null)
      return
    }
    const name = favoriteId ? artistById(favoriteId)?.name : ''
    if (!name) {
      setArt(null)
      return
    }
    let live = true
    void resolveArtistArt(name, 'banner').then((url) => {
      if (live) setArt(url)
    })
    return () => {
      live = false
    }
  }, [bannerUrl, favoriteId])

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

  return (
    <div className={cn('profile-banner', !src && 'is-empty')}>
      {src ? <img src={src} alt="" decoding="async" /> : <span className="profile-banner-fall" aria-hidden />}
      {editable ? (
        <div className="profile-banner-actions">
          <button type="button" onClick={() => inputRef.current?.click()}>
            {t.profile.bannerChange}
          </button>
          {custom ? (
            <button type="button" onClick={onClear}>
              {t.profile.bannerClear}
            </button>
          ) : null}
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
        </div>
      ) : null}
      {editable ? (
        <PhotoCrop
          kind="banner"
          draft={draft}
          onCancel={closeDraft}
          onConfirm={(next) => {
            onChange?.(next)
            closeDraft()
          }}
        />
      ) : null}
    </div>
  )
}
