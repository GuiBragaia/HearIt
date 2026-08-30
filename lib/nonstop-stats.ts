export type NonstopStats = {
  best: number
  total: number
}

function storageKey(userId: string) {
  return `hear-it-nonstop:${userId}`
}

export function readNonstopStats(userId: string): NonstopStats {
  if (typeof window === 'undefined') return { best: 0, total: 0 }
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const data = raw ? (JSON.parse(raw) as Partial<NonstopStats>) : null
    const best = Number(data?.best)
    const total = Number(data?.total)
    return {
      best: Number.isFinite(best) && best > 0 ? Math.floor(best) : 0,
      total: Number.isFinite(total) && total > 0 ? Math.floor(total) : 0,
    }
  } catch {
    return { best: 0, total: 0 }
  }
}

export function recordNonstopNamed(userId: string, sessionNamed: number) {
  const prev = readNonstopStats(userId)
  const named = Math.max(0, Math.floor(sessionNamed))
  const next: NonstopStats = {
    best: Math.max(prev.best, named),
    total: prev.total + 1,
  }
  window.localStorage.setItem(storageKey(userId), JSON.stringify(next))
  return next
}
