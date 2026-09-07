import { sanitizeShownBadges, unlockedAchievements } from '@/lib/achievements'
import { initialsFromName, profileTitle } from '@/lib/session'

export type PersonStats = {
  streak: number
  bestStreak: number
  songsGuessed: number
  songsPlayed: number
  accuracy: number
  averageTime: number
  perfectGuesses: number
  points: number
  clutchGuesses: number
  lightningGuesses: number
}

export type Person = {
  id: string
  name: string
  handle: string
  initials: string
  photo?: string
  banner?: string
  shownBadges: ReturnType<typeof unlockedAchievements>
  memberSince: number
  stats: PersonStats
  favorites: string[]
  unlocked: ReturnType<typeof unlockedAchievements>
}

export const emptyStats: PersonStats = {
  streak: 0,
  bestStreak: 0,
  songsGuessed: 0,
  songsPlayed: 0,
  accuracy: 0,
  averageTime: 0,
  perfectGuesses: 0,
  points: 0,
  clutchGuesses: 0,
  lightningGuesses: 0,
}

export function profileHref(idOrHandle: string, isYou?: boolean) {
  if (isYou) return '/profile'
  const token = idOrHandle.replace(/^@/, '')
  return `/profile/${token}`
}

export function statsFromRow(row: {
  points: number
  streak: number
  best_streak: number
  songs_guessed: number
  songs_played: number
  perfect_guesses: number
  clutch_guesses: number
  lightning_guesses: number
  sum_clip: number
}): PersonStats {
  const played = row.songs_played || 0
  const guessed = row.songs_guessed || 0
  return {
    points: row.points,
    streak: row.streak,
    bestStreak: row.best_streak,
    songsGuessed: guessed,
    songsPlayed: played,
    accuracy: played ? Math.round((guessed / played) * 100) : 0,
    averageTime: guessed ? Math.round((Number(row.sum_clip) / guessed) * 100) / 100 : 0,
    perfectGuesses: row.perfect_guesses,
    clutchGuesses: row.clutch_guesses,
    lightningGuesses: row.lightning_guesses,
  }
}

export function personFromRow(row: {
  id: string
  handle: string
  display_name: string
  photo_url: string | null
  banner_url?: string | null
  shown_badges?: string[] | null
  favorites: string[] | null
  created_at: string
  points: number
  streak: number
  best_streak: number
  songs_guessed: number
  songs_played: number
  perfect_guesses: number
  clutch_guesses: number
  lightning_guesses: number
  sum_clip: number
}): Person {
  const handle = `@${row.handle}`
  const name = row.display_name?.trim() ?? ''
  const stats = statsFromRow(row)
  const unlocked = unlockedAchievements(stats)
  return {
    id: row.id,
    name,
    handle,
    initials: initialsFromName(name || row.handle),
    photo: row.photo_url || undefined,
    banner: row.banner_url || undefined,
    shownBadges: sanitizeShownBadges(row.shown_badges, unlocked),
    memberSince: new Date(row.created_at).getFullYear(),
    stats,
    favorites: row.favorites ?? [],
    unlocked,
  }
}

export function displayOf(person: Person) {
  return profileTitle(person)
}
