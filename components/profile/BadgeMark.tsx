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

function FirstBlood() {
  return (
    <Circle>
      <circle cx="40" cy="40" r="7" fill="currentColor" />
      <circle cx="40" cy="40" r="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.55" />
    </Circle>
  )
}

function TenClub() {
  return (
    <Circle>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 10 - Math.PI / 2
        return <circle key={index} cx={40 + Math.cos(angle) * 18} cy={40 + Math.sin(angle) * 18} r="2.4" fill="currentColor" />
      })}
    </Circle>
  )
}

function WeekStreak() {
  return (
    <Circle>
      {Array.from({ length: 7 }, (_, index) => (
        <rect
          key={index}
          x={16 + index * 7.2}
          y={index === 6 ? 22 : 32}
          width="5.2"
          height={index === 6 ? 36 : 26}
          rx="1.6"
          fill="currentColor"
          opacity={0.35 + index * 0.09}
        />
      ))}
    </Circle>
  )
}

function Sharp() {
  return (
    <Circle>
      <path d="M40 14 L62 54 H18 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M40 26 L52 50 H28 Z" fill="currentColor" opacity="0.85" />
    </Circle>
  )
}

function Echo() {
  return (
    <Circle>
      <path d="M28 28 C28 22 52 22 52 28 C52 40 28 38 28 52 C28 58 52 58 52 52" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="28" cy="28" r="2.4" fill="currentColor" />
      <circle cx="52" cy="52" r="2.4" fill="currentColor" />
    </Circle>
  )
}

function Century() {
  return (
    <Circle>
      <text x="40" y="47" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="700" letterSpacing="-0.08em">
        10k
      </text>
    </Circle>
  )
}

function ClutchTen() {
  const ladder = [10, 14, 18, 24, 30, 36, 40, 44, 48, 52]
  return (
    <Circle open>
      {ladder.map((height, index) => (
        <rect
          key={index}
          x={14 + index * 5.3}
          y={66 - height}
          width="3.8"
          height={height}
          rx="1.4"
          fill="currentColor"
          opacity={index === 9 ? 1 : 0.22 + index * 0.07}
        />
      ))}
    </Circle>
  )
}

function OneShotKing() {
  return (
    <Circle>
      <circle cx="40" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.3" />
      <circle cx="40" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="40" cy="40" r="4" fill="currentColor" />
      <rect x="39.2" y="10" width="1.6" height="12" rx="0.8" fill="currentColor" />
    </Circle>
  )
}

function TwoHundred() {
  return (
    <Circle>
      {Array.from({ length: 12 }, (_, index) => (
        <circle
          key={index}
          cx={40 + Math.cos((index / 12) * Math.PI * 2) * 18}
          cy={40 + Math.sin((index / 12) * Math.PI * 2) * 18}
          r={index % 3 === 0 ? 3.2 : 1.6}
          fill="currentColor"
          opacity={index % 3 === 0 ? 1 : 0.4}
        />
      ))}
    </Circle>
  )
}

function GoldEar() {
  return (
    <>
      <polygon
        points="40,8 70,24 70,56 40,72 10,56 10,24"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <polygon
        points="40,8 70,24 70,56 40,72 10,56 10,24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeOpacity="0.4"
      />
      <circle cx="40" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="40" cy="40" r="5" fill="currentColor" />
    </>
  )
}

function GhostEar() {
  return (
    <Circle dashed>
      <path
        d="M26 46 C26 28 54 28 54 46 C54 58 50 62 46 58 C43 64 37 64 34 58 C30 62 26 58 26 46 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="34" cy="42" r="2" fill="#0c100c" />
      <circle cx="46" cy="42" r="2" fill="#0c100c" />
    </Circle>
  )
}

function YearOne() {
  return (
    <Circle>
      <circle cx="40" cy="40" r="18" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M40 40 L40 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 40 L52 40" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    </Circle>
  )
}

function Mythic() {
  return (
    <>
      <polygon points="40,10 66,28 58,60 22,60 14,28" fill="currentColor" fillOpacity="0.06" />
      <polygon points="40,10 66,28 58,60 22,60 14,28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.45" />
      <polygon points="40,22 52,32 48,48 32,48 28,32" fill="currentColor" />
    </>
  )
}

function Vinyl() {
  return (
    <Circle>
      <circle cx="40" cy="40" r="24" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="40" cy="40" r="16" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="40" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
      <circle cx="40" cy="40" r="3.2" fill="currentColor" />
    </Circle>
  )
}

const MARKS: Record<AchievementId, () => ReactNode> = {
  'first-blood': FirstBlood,
  'perfect-ear': PerfectEar,
  lightning: Lightning,
  'ten-club': TenClub,
  'never-give-up': NeverGiveUp,
  'week-streak': WeekStreak,
  sharp: Sharp,
  'music-nerd': MusicNerd,
  echo: Echo,
  'no-mercy': NoMercy,
  century: Century,
  'clutch-ten': ClutchTen,
  unstoppable: Unstoppable,
  'one-shot-king': OneShotKing,
  'two-hundred': TwoHundred,
  'gold-ear': GoldEar,
  'ghost-ear': GhostEar,
  'year-one': YearOne,
  mythic: Mythic,
  vinyl: Vinyl,
}

export function BadgeMark({ id }: { id: AchievementId }) {
  const Mark = MARKS[id]
  return (
    <svg viewBox="0 0 80 80" className="badge-mark" aria-hidden>
      <Mark />
    </svg>
  )
}