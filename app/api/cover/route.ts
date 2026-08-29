const ALLOWED_HOST = /(^|\.)mzstatic\.com$/

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('u') ?? ''
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return new Response(null, { status: 400 })
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOST.test(parsed.hostname)) {
    return new Response(null, { status: 400 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2000)
  try {
    const upstream = await fetch(parsed, {
      signal: controller.signal,
      headers: { Accept: 'image/*', Referer: '' },
      cache: 'force-cache',
    })
    if (!upstream.ok || !upstream.body) return new Response(null, { status: 404 })
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch {
    return new Response(null, { status: 404 })
  } finally {
    clearTimeout(timer)
  }
}
