import { NextResponse } from 'next/server'
import { buildNonstopQueue } from '@/lib/nonstop'

type Body = {
  exclude?: unknown
  favs?: unknown
  seenIds?: unknown
  seenKeys?: unknown
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asStringList(value: unknown) {
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean).slice(-600)
  }
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item.length > 0)
    .slice(-600)
}

async function queueFrom(input: { exclude: string; favs: string[]; seenIds: string[]; seenKeys: string[] }) {
  try {
    const payload = {
      favoriteIds: input.favs,
      exclude: input.exclude,
      seenIds: input.seenIds,
      seenKeys: input.seenKeys,
    }
    let tracks = await buildNonstopQueue(payload)
    if (!tracks.length) tracks = await buildNonstopQueue(payload)
    return NextResponse.json({ tracks }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ tracks: [] }, { status: 502 })
  }
}

export async function POST(request: Request) {
  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    body = {}
  }

  return queueFrom({
    exclude: asString(body.exclude),
    favs: asStringList(body.favs),
    seenIds: asStringList(body.seenIds),
    seenKeys: asStringList(body.seenKeys),
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  return queueFrom({
    exclude: url.searchParams.get('exclude') ?? '',
    favs: asStringList(url.searchParams.get('favs')),
    seenIds: asStringList(url.searchParams.get('seen')),
    seenKeys: asStringList(url.searchParams.get('keys')),
  })
}
