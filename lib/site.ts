export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  if (explicit) return explicit
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return `https://${production.replace(/^https?:\/\//, '')}`
  const preview = process.env.VERCEL_URL?.trim()
  if (preview) return `https://${preview.replace(/^https?:\/\//, '')}`
  return 'http://localhost:3000'
}

export function absoluteUrl(path = '/') {
  const origin = siteUrl()
  if (!path || path === '/') return origin
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
