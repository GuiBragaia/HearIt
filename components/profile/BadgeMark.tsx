import type { ReactNode } from 'react'
import type { AchievementId } from '@/lib/mock'

function Circle({ dashed = false, open = false, children }: { dashed?: boolean; open?: boolean; children?: ReactNode }) {
  return (
    <>
      <circle cx="40" cy="40" r="38" fill="currentColor" fillOpacity="0.05" />
      <circle
        cx="40"
        cy="40"
        r="36.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity={open ? 0.5 : 0.3}
        strokeWidth="1.2"
        strokeDasharray={open ? '172 58' : dashed ? '2.6 3.4' : undefined}
        strokeDashoffset={open ? 24 : undefined}
        strokeLinecap={open ? 'round' : undefined}
      />
      {children}
    </>
  )
}

function PerfectEar() {
  return (
    <Circle>
      <circle cx="40" cy="40" r="22" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1" />
      <circle cx="40" cy="40" r="11" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
      <rect x="39.15" y="12" width="1.7" height="10" rx="0.85" fill="currentColor" />
    </Circle>
  )
}

function Lightning() {
  return (
    <Circle dashed>
      <path d="M47.5 14 L32 39.5 H41.2 L34 66 L53.8 35.8 H43.2 L50.4 14 Z" fill="currentColor" />
    </Circle>
  )
}

function MusicNerd() {
  const dots = Array.from({ length: 100 }, (_, index) => {
    const col = index % 10
    const row = Math.floor(index / 10)
    const x = 19.4 + col * 4.58
    const y = 19.4 + row * 4.58
    const dx = x - 40
    const dy = y - 40
    if (dx * dx + dy * dy > 26 * 26) return null
    return <circle key={index} cx={x} cy={y} r="1.2" fill="currentColor" opacity={0.38 + ((index * 3) % 8) * 0.07} />
  })

  return <Circle>{dots}</Circle>
}

function Unstoppable() {
  return (
    <>
      <rect x="11" y="11" width="58" height="58" rx="9" fill="currentColor" fillOpacity="0.05" />
      <rect
        x="11"
        y="11"
        width="58"
        height="58"
        rx="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.2"
      />
      {Array.from({ length: 30 }, (_, index) => {
        const col = index % 6
        const row = Math.floor(index / 6)
        return (
          <rect
            key={index}
            x={16.4 + col * 8}
            y={16.6 + row * 8.2}
            width="5.6"
            height="5.6"
            rx="1.2"
            fill="currentColor"
            opacity={0.42 + (index % 4) * 0.14}
          />
        )
      })}
    </>
  )
}

function NoMercy() {
  return (
    <Circle>
      {Array.from({ length: 10 }, (_, index) => (
        <rect
          key={index}
          x={14.2 + index * 5.3}
          y="22"
          width="2.4"
          height="36"
          rx="1.2"
          fill="currentColor"
          opacity={0.55 + (index % 2) * 0.4}
        />
      ))}
    </Circle>
  )
}

function NeverGiveUp() {
  const ladder = [12, 18, 26, 34, 44]
  return (
    <Circle open>
      {ladder.map((height, index) => (
        <rect
          key={index}
          x={16.5 + index * 9.6}
          y={62 - height}
          width="6.4"
          height={height}
          rx="2.4"
          fill="currentColor"
          opacity={index === 4 ? 1 : 0.28 + index * 0.12}
        />
      ))}
    </Circle>
  )
}

const MARKS: Record<AchievementId, () => ReactNode> = {
  'perfect-ear': PerfectEar,
  lightning: Lightning,
  'music-nerd': MusicNerd,
  unstoppable: Unstoppable,
  'no-mercy': NoMercy,
  'never-give-up': NeverGiveUp,
}

export function BadgeMark({ id }: { id: AchievementId }) {
  const Mark = MARKS[id]
  return (
    <svg viewBox="0 0 80 80" className="badge-mark" aria-hidden>
      <Mark />
    </svg>
  )
}
