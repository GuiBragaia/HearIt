/** Daily + weekly cycle share São Paulo midnight. Brazil currently has no DST (UTC−3). */
export const CALENDAR_ZONE = 'America/Sao_Paulo'

export type WeekWindow = {
  start: string
  end: string
}

export function saoPauloDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CALENDAR_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function addIsoDays(iso: string, days: number) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function mondayOnOrBefore(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  const sinceMonday = weekday === 0 ? 6 : weekday - 1
  return addIsoDays(iso, -sinceMonday)
}

/** Monday 00:00 → next Monday 00:00 (end exclusive). */
export function weekWindow(now = new Date()): WeekWindow {
  const start = mondayOnOrBefore(saoPauloDay(now))
  return { start, end: addIsoDays(start, 7) }
}

export function previousWeekWindow(now = new Date()): WeekWindow {
  const { start } = weekWindow(now)
  return { start: addIsoDays(start, -7), end: start }
}

export function saoPauloMidnight(iso: string) {
  return new Date(`${iso}T00:00:00-03:00`)
}

export function weekResetCountdown(now = new Date()) {
  const diff = Math.max(0, saoPauloMidnight(weekWindow(now).end).getTime() - now.getTime())
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  const clock = [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
  return days > 0 ? `${days}d ${clock}` : clock
}

export function formatWeekRange(start: string, endExclusive: string, locale: 'en' | 'pt') {
  const last = addIsoDays(endExclusive, -1)
  const loc = locale === 'pt' ? 'pt-BR' : 'en-US'
  const from = isoParts(start)
  const to = isoParts(last)
  const month = to.toLocaleDateString(loc, {
    month: 'short',
    year: start.slice(0, 4) === last.slice(0, 4) ? undefined : 'numeric',
    timeZone: 'UTC',
  })
  if (start.slice(0, 7) === last.slice(0, 7)) {
    return `${from.getUTCDate()}–${to.getUTCDate()} ${month}`
  }
  return `${formatIso(start, loc, false)} – ${formatIso(last, loc, start.slice(0, 4) !== last.slice(0, 4))}`
}

function isoParts(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatIso(iso: string, loc: string, withYear: boolean) {
  return isoParts(iso).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  })
}

const SEEN_KEY = 'hear-it:champions-seen'

export function championsCycleId(now = new Date()) {
  return weekWindow(now).start
}

export function hasFreshChampions(hasWinners: boolean, now = new Date()) {
  if (!hasWinners || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SEEN_KEY) !== championsCycleId(now)
  } catch {
    return hasWinners
  }
}

export function markChampionsSeen(now = new Date()) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SEEN_KEY, championsCycleId(now))
  } catch {
    /* ignore */
  }
}
