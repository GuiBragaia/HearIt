'use client'

import { cn } from '@/lib/utils'

export function AlbumCover({
  src,
  alt,
  won,
  playing,
}: {
  src: string | null
  alt: string
  won?: boolean
  playing?: boolean
}) {
  if (!src) return null

  return (
    <div className={cn('album-stage', won && 'is-win', playing && 'is-on')}>
      <img src={src} alt="" className="album-bloom" aria-hidden />
      <div className="album-cover">
        <img src={src} alt={alt} />
        <span className="album-grade" aria-hidden />
        <span className="album-grain" aria-hidden />
      </div>
    </div>
  )
}
