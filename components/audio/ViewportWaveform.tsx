'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

function wavePath(width: number, height: number, amp: number, freq: number, phase: number) {
  const mid = height * 0.58
  const steps = 140
  const parts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width
    const n = (i / steps) * Math.PI * 2 * freq
    const y =
      mid +
      Math.sin(n + phase) * amp +
      Math.sin(n * 2.15 + phase * 1.3) * amp * 0.32 +
      Math.sin(n * 6.1 + phase * 0.4) * amp * 0.08
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return parts.join(' ')
}

const WIDTH = 1440
const HEIGHT = 320
const BAR_COUNT = 88

function barStyle(index: number) {
  const n = index + 1
  const mid = (BAR_COUNT - 1) / 2
  const dist = Math.abs(index - mid) / mid
  const envelope = Math.sin(Math.PI * (index / (BAR_COUNT - 1))) ** 0.62
  const dur = 0.38 + ((n * 37) % 40) / 100
  const wait = 2 + ((n * 13) % 14) / 10
  const delay = ((n * 19) % 36) / 100
  const to = 0.28 + envelope * 0.5
  return {
    ['--eq-dur' as string]: `${dur}s`,
    ['--eq-wait' as string]: `${wait}s`,
    ['--eq-delay' as string]: `${delay}s`,
    ['--eq-in' as string]: `${(dist * 0.38).toFixed(2)}s`,
    ['--eq-env' as string]: envelope.toFixed(3),
    ['--eq-to' as string]: to.toFixed(2),
  }
}

export function ViewportWaveform({
  hot = false,
  variant = 'hero',
  className,
}: {
  hot?: boolean
  variant?: 'hero' | 'horizon' | 'bars'
  className?: string
}) {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(Boolean(reduce))
  const [settled, setSettled] = useState(Boolean(reduce))
  const layers = useMemo(
    () => [
      { d: wavePath(WIDTH, HEIGHT, 54, 2.2, 0.2), opacity: 0.55, width: 1.25 },
      { d: wavePath(WIDTH, HEIGHT, 36, 3.4, 1.1), opacity: 0.28, width: 1 },
      { d: wavePath(WIDTH, HEIGHT, 18, 5.1, 2.4), opacity: 0.16, width: 0.8 },
    ],
    [],
  )
  const bars = useMemo(() => Array.from({ length: BAR_COUNT }, (_, index) => barStyle(index)), [])

  useEffect(() => {
    if (reduce) return
    const show = window.setTimeout(() => setVisible(true), 30)
    const live = window.setTimeout(() => setSettled(true), 1080)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(live)
    }
  }, [reduce])

  if (variant === 'bars') {
    return (
      <div
        className={cn(
          'viewport-wave bars',
          visible && 'is-in',
          settled && 'is-settled',
          hot && 'is-hot',
          reduce && 'is-still',
          className,
        )}
        aria-hidden
      >
        <span className="bars-bloom" />
        {bars.map((style, index) => (
          <i key={index} style={style} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('viewport-wave', variant, hot && 'is-hot', reduce && 'is-still', className)} aria-hidden>
      <svg className="wave-track" viewBox={`0 0 ${WIDTH * 2} ${HEIGHT}`} preserveAspectRatio="none">
        {[0, WIDTH].map((offset) => (
          <g key={offset} transform={`translate(${offset} 0)`}>
            {layers.map((layer, index) => (
              <path
                key={`${offset}-${index}`}
                d={layer.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={layer.width}
                strokeLinecap="round"
                opacity={layer.opacity}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}
