import { dailyKey } from '@/lib/game'
import { loadTodayRun, resetTodayRunRemote, submitTodayRun } from '@/lib/db'
import { getSupabase } from '@/lib/supabase'

export type DailyRun = {
  key: string
  songId: string
  won: boolean
  score: number
  duration: number
  level: number
}

const STORAGE_KEY = 'hear-it-daily-run'
export const DAILY_RESET_EVENT = 'hear-it-reset-daily'

function readLocal(songId: string, now = new Date()): DailyRun | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DailyRun
    if (parsed.key !== dailyKey(now) || parsed.songId !== songId) return null
    return parsed
  } catch {
    return null
  }
}

function writeLocal(run: DailyRun) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(run))
}

export async function readDailyRun(songId: string, userId?: string | null) {
  if (userId && getSupabase()) return loadTodayRun(userId, songId)
  return readLocal(songId)
}

export async function writeDailyRun(run: DailyRun, userId?: string | null) {
  if (userId && getSupabase()) {
    await submitTodayRun(run)
    return
  }
  writeLocal(run)
}

export function clearDailyRun() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export async function resetDailyRun(userId?: string | null) {
  if (userId && getSupabase()) await resetTodayRunRemote()
  else clearDailyRun()
  window.dispatchEvent(new Event(DAILY_RESET_EVENT))
}
