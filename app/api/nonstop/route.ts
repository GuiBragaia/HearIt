import { NextResponse } from 'next/server'
import { buildNonstopQueue } from '@/lib/nonstop'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const exclude = url.searchParams.get('exclude') ?? ''
  const favs = url.searchParams.get('favs')?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
  const seen = url.searchParams.get('seen')?.split(',').map((item) => item.trim()).filter(Boolean) ?? []

  try {
    const tracks = await buildNonstopQueue({ favoriteIds: favs, exclude, seenIds: seen })
    return NextResponse.json({ tracks }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ tracks: [] }, { status: 502 })
  }
}
