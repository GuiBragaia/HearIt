import { catalog, type Song } from '@/lib/mock'

const EPOCH = Date.UTC(2026, 0, 1)

/** Pin a catalog id to force today's Daily. Set to null to rotate. */
const PINNED_DAILY_ID: string | null = 'bones'

export function songForDay(now = new Date()): Song {
  const pinned = PINNED_DAILY_ID ? catalog.find((item) => item.id === PINNED_DAILY_ID) : null
  if (pinned) return pinned

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.floor((today - EPOCH) / 86_400_000)
  const index = ((days % catalog.length) + catalog.length) % catalog.length
  return catalog[index] ?? catalog[0]
}

export function dailyNumber(now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(1, Math.floor((today - EPOCH) / 86_400_000) + 1)
}

export function songById(id: string) {
  return catalog.find((item) => item.id === id) ?? null
}
