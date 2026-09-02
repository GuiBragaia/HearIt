import { CLIP_LENGTHS, dailyKey } from '@/lib/game'
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
const PROGRESS_KEY = 'hear-it-daily-progress'
export const DAILY_RESET_EVENT = 'hear-it-reset-daily'

const LAST_LEVEL = CLIP_LENGTHS.length - 1

function clampLevel(level: number) {
  if (!Number.isFinite(level)) return 0
  return Math.min(LAST_LEVEL, Math.max(0, Math.floor(level)))
}

type DailyProgress = {
  key: string
  songId: string
  level: number
}

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

export function readDailyProgress(songId: string, now = new Date()) {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as DailyProgress
    if (parsed.key !== dailyKey(now) || parsed.songId !== songId) return 0
    return clampLevel(Number(parsed.level))
  } catch {
    return 0
  }
}

export function writeDailyProgress(songId: string, level: number, now = new Date()) {
  if (typeof window === 'undefined') return
  const next = clampLevel(level)
  if (next <= 0) {
    window.localStorage.removeItem(PROGRESS_KEY)
    return
  }
  const payload: DailyProgress = { key: dailyKey(now), songId, level: next }
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(payload))
}

export function clearDailyProgress() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PROGRESS_KEY)
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
  clearDailyProgress()
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
  clearDailyProgress()
}

export async function resetDailyRun(userId?: string | null) {
  if (userId && getSupabase()) await resetTodayRunRemote()
  clearDailyRun()
  window.dispatchEvent(new Event(DAILY_RESET_EVENT))
}
