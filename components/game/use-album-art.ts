'use client'

import { useEffect, useState } from 'react'
import { songForDay } from '@/lib/songs'

export function useAlbumArt() {
  const [src, setSrc] = useState<string | null>(null)
  const song = songForDay()

  useEffect(() => {
    let live = true
    const params = new URLSearchParams({
      id: song.id,
      title: song.title,
      artist: song.artist,
    })
    void fetch(`/api/daily-track?${params}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((track: { artworkUrl?: string | null }) => {
        if (live) setSrc(track.artworkUrl ?? null)
      })
      .catch(() => {
        if (live) setSrc(null)
      })
    return () => {
      live = false
    }
  }, [song.id, song.title, song.artist])

  return src
}
