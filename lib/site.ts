export function siteUrl() {
  return (
    asOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    asOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    asOrigin(process.env.VERCEL_URL) ||
    'http://localhost:3000'
  )
}

function asOrigin(raw?: string) {
  const value = raw?.trim().replace(/\/$/, '')
  if (!value) return ''
  try {
    return new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`).origin
  } catch {
    return ''
  }
}

export function absoluteUrl(path = '/') {
  const origin = siteUrl()
  if (!path || path === '/') return origin
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
