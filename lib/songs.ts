import { catalog, type Song } from '@/lib/mock'

const EPOCH = Date.UTC(2026, 0, 1)
const ZONE = 'America/Sao_Paulo'

/**
 * Daily queue for this week (São Paulo calendar).
 * Swap the ids next week.
 */
const DAILY_WEEK: Record<string, string> = {
  '2026-09-03': 'lithium',
  '2026-09-04': 'take-on-me',
  '2026-09-05': 'blinding-lights',
  '2026-09-06': 'feel-good-inc',
  '2026-09-07': 'midnight-city',
  '2026-09-08': 'toxicity',
  '2026-09-09': 'electric-feel',
}

function saoPauloDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function songByCatalogId(id?: string) {
  if (!id) return null
  return catalog.find((item) => item.id === id) ?? null
}

function scheduledSong(now = new Date()) {
  const day = saoPauloDay(now)
  const hit = songByCatalogId(DAILY_WEEK[day])
  if (hit) return hit

  const days = Object.keys(DAILY_WEEK).sort()
  const last = days[days.length - 1]
  const first = days[0]
  if (last && day > last) return songByCatalogId(DAILY_WEEK[last])
  if (first && day < first) return songByCatalogId(DAILY_WEEK[first])
  return null
}

export function songForDay(now = new Date()): Song {
  return scheduledSong(now) ?? catalog[0]
}

export function dailyNumber(now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(1, Math.floor((today - EPOCH) / 86_400_000) + 1)
}

export function songById(id: string) {
  return catalog.find((item) => item.id === id) ?? null
}
