import { searchGuesses } from '@/lib/guess-search'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (query.length < 2) return Response.json({ hits: [] })

  try {
    const hits = await searchGuesses(query)
    return Response.json(
      { hits },
      { headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=600' } },
    )
  } catch {
    return Response.json({ hits: [] }, { headers: { 'Cache-Control': 'public, max-age=30' } })
  }
}
