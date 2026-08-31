import { deezerFresh } from '@/lib/deezer'

const ALLOWED_HOST = /(^|\.)dzcdn\.net$/i

async function sourceUrl(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (id && /^\d{1,12}$/.test(id)) {
    const track = await deezerFresh<{ preview?: string }>(`/track/${id}`)
    const preview = track?.preview?.trim()
    if (!preview) return null
    return new URL(preview)
  }

  const raw = url.searchParams.get('u') ?? ''
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:' || !ALLOWED_HOST.test(parsed.hostname)) return null
    return parsed
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const parsed = await sourceUrl(request)
  if (!parsed) return new Response(null, { status: 400 })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const upstream = await fetch(parsed, {
      signal: controller.signal,
      headers: { Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8', Referer: '' },
      cache: 'no-store',
    })
    if (!upstream.ok || !upstream.body) return new Response(null, { status: 404 })
    const headers = new Headers()
    headers.set('Content-Type', upstream.headers.get('content-type') ?? 'audio/mpeg')
    headers.set('Cache-Control', 'public, max-age=600')
    const length = upstream.headers.get('content-length')
    if (length) headers.set('Content-Length', length)
    return new Response(upstream.body, { status: 200, headers })
  } catch {
    return new Response(null, { status: 404 })
  } finally {
    clearTimeout(timer)
  }
}
