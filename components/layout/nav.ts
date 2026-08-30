export const NAV_ITEMS = [
  { href: '/daily', key: 'daily' as const },
  { href: '/plays', key: 'plays' as const },
  { href: '/online', key: 'online' as const, developing: true },
  { href: '/leaderboard', key: 'leaderboard' as const },
  { href: '/profile', key: 'profile' as const },
]

export const ROUTE_ORDER = ['/', '/play', '/daily', '/plays', '/online', '/leaderboard', '/join', '/login', '/profile'] as const

export function routeIndex(pathname: string) {
  const exact = ROUTE_ORDER.indexOf(pathname as (typeof ROUTE_ORDER)[number])
  if (exact >= 0) return exact
  return ROUTE_ORDER.findIndex((route) => route !== '/' && pathname.startsWith(route))
}

export function routeDirection(from: string, to: string) {
  const delta = routeIndex(to) - routeIndex(from)
  if (delta === 0 || Number.isNaN(delta)) return 0
  return delta > 0 ? 1 : -1
}

