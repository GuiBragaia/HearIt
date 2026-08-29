'use client'

import { useEffect, useState } from 'react'
import { resolveDailyTrack } from '@/lib/itunes'
import { songForDay } from '@/lib/songs'

export function useAlbumArt() {
  const [src, setSrc] = useState<string | null>(null)
  const song = songForDay()

  useEffect(() => {
    let live = true
    void resolveDailyTrack(song).then((track) => {
      if (live) setSrc(track.artworkUrl)
    })
    return () => {
      live = false
    }
  }, [song.id])

  return src
}
