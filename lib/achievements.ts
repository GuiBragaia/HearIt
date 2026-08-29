import type { AchievementId } from '@/lib/mock'
import type { PersonStats } from '@/lib/people'

export const ACHIEVEMENT_IDS: AchievementId[] = [
  'perfect-ear',
  'lightning',
  'music-nerd',
  'unstoppable',
  'no-mercy',
  'never-give-up',
]

export function unlockedAchievements(stats: PersonStats & { clutchGuesses?: number; lightningGuesses?: number }) {
  const ids: AchievementId[] = []
  if (stats.perfectGuesses >= 1) ids.push('perfect-ear')
  if ((stats.lightningGuesses ?? 0) >= 1 || (stats.averageTime > 0 && stats.averageTime <= 1 && stats.songsGuessed > 0))
    ids.push('lightning')
  if (stats.songsGuessed >= 100) ids.push('music-nerd')
  if (stats.bestStreak >= 30) ids.push('unstoppable')
  if (stats.perfectGuesses >= 10) ids.push('no-mercy')
  if ((stats.clutchGuesses ?? 0) >= 1) ids.push('never-give-up')
  return ids
}

export function achievementList(unlocked: AchievementId[]) {
  const set = new Set(unlocked)
  return ACHIEVEMENT_IDS.map((id) => ({ id, unlocked: set.has(id) }))
}
