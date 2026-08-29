'use client'

import { useEffect, useRef, useState } from 'react'
import { resolveArtistArt } from '@/lib/artist-art'
import { cn } from '@/lib/utils'

export function ArtistThumb({
  name,
  className,
  lazy = false,
}: {
  name: string
  className?: string
  lazy?: boolean
}) {
  const root = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(!lazy)
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!lazy || visible) return
    const node = root.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { rootMargin: '120px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [lazy, visible])

  useEffect(() => {
    if (!visible) return
    let live = true
    void resolveArtistArt(name).then((url) => {
      if (live) setSrc(url)
    })
    return () => {
      live = false
    }
  }, [name, visible])

  return (
    <span ref={root} className={cn('artist-thumb', className)}>
      {src ? (
        <img
          src={src}
          alt=""
          onError={() => {
            setSrc(null)
          }}
        />
      ) : (
        <span className="artist-thumb-empty" />
      )}
      <i aria-hidden />
    </span>
  )
}
