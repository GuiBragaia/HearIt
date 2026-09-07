'use client'

import { useEffect, useRef, useState } from 'react'
import { artistById } from '@/lib/artists'
import { resolveArtistArt } from '@/lib/artist-art'
import { exportBanner, readPhotoFile } from '@/lib/photo'
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
  const custom = Boolean(bannerUrl)
  const src = bannerUrl || art || undefined

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
    void resolveArtistArt(name).then((url) => {
      if (live) setArt(url)
    })
    return () => {
      live = false
    }
  }, [bannerUrl, favoriteId])

  const onFile = async (file?: File) => {
    if (!file) return
    try {
      const draft = await readPhotoFile(file)
      const image = new Image()
      image.onload = () => {
        URL.revokeObjectURL(draft.url)
        try {
          onChange?.(exportBanner(image))
        } catch {
          /* keep current */
        }
      }
      image.onerror = () => URL.revokeObjectURL(draft.url)
      image.src = draft.url
    } catch {
      /* keep current */
    }
  }

  return (
    <div className={cn('profile-banner', !src && 'is-empty')}>
      {src ? <img src={src} alt="" /> : <span className="profile-banner-fall" aria-hidden />}
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
    </div>
  )
}