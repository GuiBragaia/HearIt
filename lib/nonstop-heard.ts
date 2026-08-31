const KEY = (userId: string) => `hear-it-nonstop-heard:${userId}`
const MAX = 400

function parseIds(raw: string | null) {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.filter((id): id is string => typeof id === 'string' && id.length > 0).slice(-MAX)
  } catch {
    return []
  }
}

export function readHeardIds(userId: string) {
  if (typeof window === 'undefined') return []
  return parseIds(window.localStorage.getItem(KEY(userId)))
}

export function rememberHeardIds(userId: string, ids: string[]) {
  if (typeof window === 'undefined' || !ids.length) return
  const prev = readHeardIds(userId)
  const seen = new Set(prev)
  const next = [...prev]
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    next.push(id)
  }
  window.localStorage.setItem(KEY(userId), JSON.stringify(next.slice(-MAX)))
}
