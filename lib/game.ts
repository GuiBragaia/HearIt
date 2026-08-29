export const CLIP_LENGTHS = [0.1, 0.5, 1, 5, 10] as const

export type ClipLength = (typeof CLIP_LENGTHS)[number]

export const SCORE_BY_LEVEL = [1000, 820, 680, 420, 260] as const

export type GamePhase =
  | 'idle'
  | 'playing'
  | 'wrong'
  | 'correct'
  | 'perfect'
  | 'failed'
  | 'result'

export function formatDuration(value: number) {
  if (!Number.isFinite(value)) return '0s'
  return value < 1 ? `${value.toFixed(1)}s` : `${value}s`
}

export function skipDelta(level: number) {
  if (level >= CLIP_LENGTHS.length - 1) return 0
  return Number((CLIP_LENGTHS[level + 1] - CLIP_LENGTHS[level]).toFixed(1))
}

export function scoreForLevel(level: number) {
  return SCORE_BY_LEVEL[Math.min(level, SCORE_BY_LEVEL.length - 1)] ?? 0
}

export function normalizeGuess(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function matchesSong(
  input: string,
  song: { title: string; artist: string; aliases: string[] },
) {
  const guess = normalizeGuess(input)
  if (guess.length < 4) return false

  const title = normalizeGuess(song.title)
  const artist = normalizeGuess(song.artist)
  const aliases = song.aliases.map(normalizeGuess)

  if (guess === title) return true
  if (aliases.includes(guess)) return true
  if (guess.includes(title) && title.length >= 5) return true
  if (title.includes(guess) && guess.length >= Math.min(10, title.length)) return true
  if (`${title} ${artist}` === guess || `${artist} ${title}` === guess) return true
  return false
}

export function dailyKey(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function nextResetLabel(now = new Date()) {
  const tomorrow = new Date(now)
  tomorrow.setHours(24, 0, 0, 0)
  const diff = Math.max(0, tomorrow.getTime() - now.getTime())
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}
