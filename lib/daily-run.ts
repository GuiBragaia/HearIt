import { dailyKey } from '@/lib/game'
import { loadTodayRun, resetTodayRunRemote, submitTodayRun } from '@/lib/db'
import { songForDay } from '@/lib/songs'
import { getSupabase } from '@/lib/supabase'

export type DailyRun = {
  key: string
  songId: string
  won: boolean
  score: number
  duration: number
  level: number
  claimedBy?: string
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

function isClaimableBy(run: DailyRun, userId: string) {
  return !run.claimedBy || run.claimedBy === userId
}

function markClaimed(run: DailyRun, userId: string) {
  writeLocal({ ...run, claimedBy: userId })
}

export async function readDailyRun(songId: string, userId?: string | null) {
  const local = readLocal(songId)
  if (userId && getSupabase()) {
    const remote = await loadTodayRun(userId, songId)
    if (remote) {
      if (local && isClaimableBy(local, userId) && !local.claimedBy) markClaimed(local, userId)
      return remote
    }
    if (local && isClaimableBy(local, userId)) {
      const saved = await submitTodayRun(local)
      if (saved) markClaimed(local, userId)
      return local
    }
    return null
  }
  return local
}

export async function writeDailyRun(run: DailyRun, userId?: string | null) {
  if (userId && getSupabase()) {
    markClaimed(run, userId)
    await submitTodayRun(run)
    return
  }
  writeLocal(run)
}

export async function claimGuestDailyRun(userId: string) {
  if (!userId || !getSupabase()) return null
  const songId = songForDay().id
  const local = readLocal(songId)
  if (!local || !isClaimableBy(local, userId)) return null
  const remote = await loadTodayRun(userId, songId)
  if (remote) {
    if (!local.claimedBy) markClaimed(local, userId)
    return null
  }
  const saved = await submitTodayRun(local)
  if (!saved) return null
  markClaimed(local, userId)
  return local
}

export function clearDailyRun() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export async function resetDailyRun(userId?: string | null) {
  if (userId && getSupabase()) await resetTodayRunRemote()
  clearDailyRun()
  window.dispatchEvent(new Event(DAILY_RESET_EVENT))
}
