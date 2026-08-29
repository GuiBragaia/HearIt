'use client'

import { BadgeMark } from '@/components/profile/BadgeMark'
import { ACHIEVEMENT_IDS, achievementList, unlockedAchievements } from '@/lib/achievements'
import { useSession } from '@/components/auth/session-context'
import { emptyStats } from '@/lib/people'
import { type AchievementId } from '@/lib/mock'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function AchievementGrid({ unlockedIds }: { unlockedIds?: AchievementId[] }) {
  const { t } = useI18n()
  const { user } = useSession()
  const ids = unlockedIds ?? unlockedAchievements(user?.stats ?? emptyStats)
  const items = achievementList(ids)
  const unlocked = items.filter((item) => item.unlocked).length

  return (
    <div className="badge-block">
      <div className="badge-head">
        <h2>{t.profile.achievements}</h2>
        <p>
          {unlocked}/{ACHIEVEMENT_IDS.length}
        </p>
      </div>
      {ACHIEVEMENT_IDS.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">{t.states.emptyAchievements}</p>
      ) : (
        <ul className="badge-grid">
          {items.map((item) => {
            const copy = t.achievements[item.id]
            return (
              <li key={item.id} className={cn('badge', item.unlocked ? 'is-on' : 'is-off')} data-id={item.id}>
                <div className="badge-seal">
                  <BadgeMark id={item.id} />
                </div>
                <p className="badge-stat">{copy.stat}</p>
                <p className="badge-name">{copy.name}</p>
                <p className="badge-hint">{copy.hint}</p>
                {!item.unlocked ? <p className="badge-lock">{t.profile.locked}</p> : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
