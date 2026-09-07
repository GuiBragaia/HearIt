'use client'

import { BadgeMark } from '@/components/profile/BadgeMark'
import {
  ACHIEVEMENT_IDS,
  SHOW_BADGE_MAX,
  achievementList,
  displayShownBadges,
  sanitizeShownBadges,
  unlockedAchievements,
} from '@/lib/achievements'
import { useSession } from '@/components/auth/session-context'
import { emptyStats } from '@/lib/people'
import { type AchievementId } from '@/lib/mock'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function ShownBadges({
  ids,
  unlocked,
}: {
  ids: AchievementId[]
  unlocked: AchievementId[]
}) {
  const { t } = useI18n()
  const shown = displayShownBadges(ids, unlocked)
  if (!shown.length) return null
  return (
    <ul className="badge-wear">
      {shown.map((id) => (
        <li key={id} className="badge-wear-item" title={t.achievements[id].name}>
          <BadgeMark id={id} />
        </li>
      ))}
    </ul>
  )
}

export function AchievementGrid({
  unlockedIds,
  shownBadges,
  editable = false,
}: {
  unlockedIds?: AchievementId[]
  shownBadges?: AchievementId[]
  editable?: boolean
}) {
  const { t } = useI18n()
  const { user, updateProfile } = useSession()
  const ids = unlockedIds ?? unlockedAchievements(user?.stats ?? emptyStats)
  const items = achievementList(ids)
  const unlocked = items.filter((item) => item.unlocked).length
  const pinned = sanitizeShownBadges(shownBadges ?? user?.shownBadges ?? [], ids)

  const toggle = (id: AchievementId) => {
    if (!editable) return
    if (!ids.includes(id)) return
    if (pinned.includes(id)) {
      void updateProfile({ shownBadges: pinned.filter((item) => item !== id) })
      return
    }
    const next =
      pinned.length >= SHOW_BADGE_MAX ? [...pinned.slice(1), id] : [...pinned, id]
    void updateProfile({ shownBadges: next })
  }

  return (
    <div className="badge-block">
      <div className="badge-head">
        <h2>{t.profile.achievements}</h2>
        <p>
          {unlocked}/{ACHIEVEMENT_IDS.length}
        </p>
      </div>
      {editable && unlocked > 0 ? <p className="badge-pick">{t.profile.shownPick}</p> : null}
      {ACHIEVEMENT_IDS.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">{t.states.emptyAchievements}</p>
      ) : (
        <ul className="badge-grid">
          {items.map((item) => {
            const copy = t.achievements[item.id]
            const selected = pinned.includes(item.id)
            const pickable = editable && item.unlocked
            const className = cn(
              'badge',
              item.unlocked ? 'is-on' : 'is-off',
              selected && 'is-shown',
              pickable && 'is-pick',
            )
            const inner = (
              <>
                <div className="badge-seal">
                  <BadgeMark id={item.id} />
                </div>
                <p className="badge-name">{copy.name}</p>
                {!item.unlocked ? <p className="badge-lock">{t.profile.locked}</p> : null}
              </>
            )
            return (
              <li key={item.id}>
                {pickable ? (
                  <button
                    type="button"
                    className={className}
                    data-id={item.id}
                    title={`${copy.name} — ${copy.hint}`}
                    onClick={() => toggle(item.id)}
                  >
                    {inner}
                  </button>
                ) : (
                  <div className={className} data-id={item.id} title={`${copy.name} — ${copy.hint}`}>
                    {inner}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}