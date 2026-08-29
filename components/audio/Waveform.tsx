'use client'

import { useId, useMemo } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

const COUNT = 56
const WIDTH = 560
const HEIGHT = 168
const MID = 72
const MIRROR = 118

function round(n: number) {
  return Math.round(n * 1000) / 1000
}

function barValue(index: number) {
  const t = index / (COUNT - 1)
  const envelope = Math.sin(Math.PI * t) ** 0.72
  const grain =
    0.38 +
    0.62 *
      Math.abs(
        Math.sin(index * 0.71) * 0.55 +
          Math.sin(index * 1.37 + 0.4) * 0.35 +
          Math.sin(index * 2.11) * 0.18,
      )
  return round(0.1 + envelope * grain * 0.9)
}

export function Waveform({
  active,
  progress,
  intensity = 1,
}: {
  active: boolean
  progress: number
  intensity?: number
}) {
  const reduce = useReducedMotion()
  const uid = useId()
  const bars = useMemo(() => Array.from({ length: COUNT }, (_, i) => barValue(i)), [])
  const gap = WIDTH / COUNT
  const barW = Math.max(2.4, gap * 0.55)
  const playX = Math.max(barW, Math.min(WIDTH - barW, progress * WIDTH))

  return (
    <div
      className={cn('wave-scene', active ? 'is-active' : 'is-idle', reduce && 'is-still')}
      aria-hidden
      style={{ height: `${128 + intensity * 16}px` }}
    >
      <span className="wave-bloom" />
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="wave-svg">
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8f7a8" />
            <stop offset="55%" stopColor="#c8f35a" />
            <stop offset="100%" stopColor="#8fb83a" />
          </linearGradient>
          <linearGradient id={`${uid}-rest`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d5dcc8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#8b9084" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={`${uid}-mirror`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8f35a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#c8f35a" stopOpacity="0" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {bars.map((value, index) => {
          const h = round(value * 64 * intensity)
          const x = round(index * gap + (gap - barW) / 2)
          const played = index / COUNT <= progress
          const delay = `${index * 18}ms`
          return (
            <g key={index} className={cn('wave-col', played && 'is-played')} style={{ animationDelay: delay }}>
              <rect
                className="wave-bar"
                x={x}
                y={round(MID - h / 2)}
                width={round(barW)}
                height={h}
                rx={round(barW / 2)}
                fill={played ? `url(#${uid}-fill)` : `url(#${uid}-rest)`}
                filter={played ? `url(#${uid}-glow)` : undefined}
                style={{ animationDelay: delay }}
              />
              <rect
                className="wave-mirror"
                x={x}
                y={MIRROR}
                width={round(barW)}
                height={round(h * 0.42)}
                rx={round(barW / 2)}
                fill={played ? `url(#${uid}-mirror)` : 'rgba(243,244,234,0.06)'}
                style={{ animationDelay: delay }}
              />
            </g>
          )
        })}

        {progress > 0.02 ? (
          <g className="wave-head">
            <line
              x1={playX}
              y1={18}
              x2={playX}
              y2={MID + 36}
              stroke="#c8f35a"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle cx={playX} cy={MID} r="3.2" fill="#c8f35a" />
          </g>
        ) : null}
      </svg>
    </div>
  )
}
