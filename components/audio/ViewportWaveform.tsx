'use client'

import { useMemo } from 'react'
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

export function ViewportWaveform({
  hot = false,
  variant = 'hero',
  className,
}: {
  hot?: boolean
  variant?: 'hero' | 'horizon'
  className?: string
}) {
  const reduce = useReducedMotion()
  const layers = useMemo(
    () => [
      { d: wavePath(WIDTH, HEIGHT, 54, 2.2, 0.2), opacity: 0.55, width: 1.25 },
      { d: wavePath(WIDTH, HEIGHT, 36, 3.4, 1.1), opacity: 0.28, width: 1 },
      { d: wavePath(WIDTH, HEIGHT, 18, 5.1, 2.4), opacity: 0.16, width: 0.8 },
    ],
    [],
  )

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
