import type { AchievementId } from '@/lib/mock'
import type { PersonStats } from '@/lib/people'

export const ACHIEVEMENT_IDS: AchievementId[] = [
  'first-blood',
  'perfect-ear',
  'lightning',
  'ten-club',
  'never-give-up',
  'week-streak',
  'sharp',
  'music-nerd',
  'echo',
  'no-mercy',
  'century',
  'clutch-ten',
  'unstoppable',
  'one-shot-king',
  'two-hundred',
  'gold-ear',
  'ghost-ear',
  'year-one',
  'mythic',
  'vinyl',
]

export const SHOW_BADGE_MAX = 3

export function unlockedAchievements(
  stats: PersonStats & { clutchGuesses?: number; lightningGuesses?: number },
) {
  const ids: AchievementId[] = []
  const played = stats.songsPlayed ?? stats.songsGuessed
  if (stats.songsGuessed >= 1) ids.push('first-blood')
  if (stats.perfectGuesses >= 1) ids.push('perfect-ear')
  if (
    (stats.lightningGuesses ?? 0) >= 1 ||
    (stats.averageTime > 0 && stats.averageTime <= 1 && stats.songsGuessed > 0)
  ) {
    ids.push('lightning')
  }
  if (stats.songsGuessed >= 10) ids.push('ten-club')
  if ((stats.clutchGuesses ?? 0) >= 1) ids.push('never-give-up')
  if (stats.bestStreak >= 7 || stats.streak >= 7) ids.push('week-streak')
  if (stats.accuracy >= 90 && played >= 20) ids.push('sharp')
  if (stats.songsGuessed >= 100) ids.push('music-nerd')
  if (stats.bestStreak >= 14 || stats.streak >= 14) ids.push('echo')
  if (stats.perfectGuesses >= 10) ids.push('no-mercy')
  if (stats.points >= 10_000) ids.push('century')
  if ((stats.clutchGuesses ?? 0) >= 10) ids.push('clutch-ten')
  if (stats.bestStreak >= 30) ids.push('unstoppable')
  if (stats.perfectGuesses >= 25) ids.push('one-shot-king')
  if (stats.songsGuessed >= 200) ids.push('two-hundred')
  if (stats.points >= 50_000) ids.push('gold-ear')
  if (stats.perfectGuesses >= 50) ids.push('ghost-ear')
  if (played >= 365) ids.push('year-one')
  if (stats.points >= 100_000) ids.push('mythic')
  if (stats.songsGuessed >= 500) ids.push('vinyl')
  return ids
}

export function achievementList(unlocked: AchievementId[]) {
  const set = new Set(unlocked)
  return ACHIEVEMENT_IDS.map((id) => ({ id, unlocked: set.has(id) }))
}

export function sanitizeShownBadges(raw: unknown, unlocked: AchievementId[]) {
  const have = new Set(unlocked)
  const allowed = new Set<string>(ACHIEVEMENT_IDS)
  const list = Array.isArray(raw) ? raw : []
  const out: AchievementId[] = []
  for (const item of list) {
    if (typeof item !== 'string' || !allowed.has(item)) continue
    const id = item as AchievementId
    if (!have.has(id) || out.includes(id)) continue
    out.push(id)
    if (out.length >= SHOW_BADGE_MAX) break
  }
  return out
}

export function displayShownBadges(shown: AchievementId[], unlocked: AchievementId[]) {
  const clean = sanitizeShownBadges(shown, unlocked)
  if (clean.length) return clean
  return unlocked.slice(0, SHOW_BADGE_MAX)
}