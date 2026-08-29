'use client'

import { useEffect, useRef, useState, type PointerEvent, type TouchEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { centeredCrop, clampPan, coverScale, exportCrop, type PhotoDraft } from '@/lib/photo'
import { OverlayPortal } from '@/components/overlay-portal'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function PhotoCrop({
  draft,
  onCancel,
  onConfirm,
}: {
  draft: PhotoDraft | null
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const viewRef = useRef({ x: 0, y: 0, scale: 1 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const pinch = useRef<{ dist: number; scale: number } | null>(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const [crop, setCrop] = useState(320)
  const [ready, setReady] = useState(false)

  viewRef.current = view

  useEffect(() => {
    if (!draft) {
      setReady(false)
      return
    }
    const measure = () => {
      const size = stageRef.current?.clientWidth || 320
      setCrop(size)
      setView(centeredCrop(draft.width, draft.height, size))
      setReady(true)
    }
    const frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [draft])

  useEffect(() => {
    if (!draft) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [draft, onCancel])

  useEffect(() => {
    const node = stageRef.current
    if (!node || !draft) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const current = viewRef.current
      const min = coverScale(draft.width, draft.height, crop)
      const nextScale = Math.min(min * 4, Math.max(min, current.scale * (event.deltaY > 0 ? 0.92 : 1.08)))
      const box = node.getBoundingClientRect()
      const px = event.clientX - box.left
      const py = event.clientY - box.top
      const ratio = nextScale / current.scale
      const x = px - (px - current.x) * ratio
      const y = py - (py - current.y) * ratio
      setView({ scale: nextScale, ...clampPan(x, y, draft.width, draft.height, nextScale, crop) })
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [draft, crop])

  const minScale = coverScale(draft?.width ?? 1, draft?.height ?? 1, crop)
  const maxScale = minScale * 4

  const apply = (next: { x: number; y: number; scale: number }) => {
    if (!draft) return
    const scale = Math.min(maxScale, Math.max(minScale, next.scale))
    setView({ scale, ...clampPan(next.x, next.y, draft.width, draft.height, scale, crop) })
  }

  const zoomAt = (clientX: number, clientY: number, nextScale: number) => {
    const box = stageRef.current?.getBoundingClientRect()
    if (!box) return
    const px = clientX - box.left
    const py = clientY - box.top
    const scale = Math.min(maxScale, Math.max(minScale, nextScale))
    const ratio = scale / view.scale
    apply({ x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio, scale })
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: view.x, y: view.y, px: event.clientX, py: event.clientY }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    apply({
      x: drag.current.x + (event.clientX - drag.current.px),
      y: drag.current.y + (event.clientY - drag.current.py),
      scale: view.scale,
    })
  }

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return
    const a = event.touches[0]
    const b = event.touches[1]
    if (!a || !b) return
    pinch.current = {
      dist: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
      scale: view.scale,
    }
  }

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinch.current) return
    const a = event.touches[0]
    const b = event.touches[1]
    if (!a || !b) return
    const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
    zoomAt((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2, pinch.current.scale * (dist / pinch.current.dist))
  }

  const confirm = () => {
    const image = imageRef.current
    if (!image) return
    try {
      onConfirm(exportCrop(image, { ...view, size: crop }))
    } catch {
      /* keep draft */
    }
  }

  return (
    <OverlayPortal>
      <AnimatePresence>
      {draft ? (
        <motion.div
          key="crop"
          className="crop-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crop-title"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="crop-body"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="crop-kicker">{t.profile.photoChange}</p>
            <h2 id="crop-title" className="crop-title">
              {t.profile.photoCrop}
            </h2>
            <p className="crop-lead">{t.profile.photoCropLead}</p>

            <div
              ref={stageRef}
              className={cn('crop-stage', ready && 'is-ready')}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => {
                drag.current = null
              }}
              onPointerCancel={() => {
                drag.current = null
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => {
                pinch.current = null
              }}
            >
              <img
                ref={imageRef}
                src={draft.url}
                alt=""
                draggable={false}
                style={{
                  width: draft.width * view.scale,
                  height: draft.height * view.scale,
                  transform: `translate(${view.x}px, ${view.y}px)`,
                }}
              />
            </div>
            <p className="crop-hint">{t.profile.photoCropHint}</p>

            <button type="button" className="crop-use" onClick={confirm}>
              {t.profile.photoCropUse}
            </button>
            <button type="button" className="crop-cancel" onClick={onCancel}>
              {t.profile.photoCropCancel}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </OverlayPortal>
  )
}
