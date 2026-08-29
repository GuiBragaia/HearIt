export type Artist = {
  id: string
  name: string
}

export const artists: Artist[] = [
  { id: 'the-weeknd', name: 'The Weeknd' },
  { id: 'daft-punk', name: 'Daft Punk' },
  { id: 'tame-impala', name: 'Tame Impala' },
  { id: 'm83', name: 'M83' },
  { id: 'mgmt', name: 'MGMT' },
  { id: 'the-1975', name: 'The 1975' },
  { id: 'dua-lipa', name: 'Dua Lipa' },
  { id: 'steve-lacy', name: 'Steve Lacy' },
  { id: 'system-of-a-down', name: 'System Of A Down' },
  { id: 'the-temper-trap', name: 'The Temper Trap' },
  { id: 'kavinsky', name: 'Kavinsky' },
  { id: 'gorillaz', name: 'Gorillaz' },
  { id: 'a-ha', name: 'a-ha' },
  { id: 'tears-for-fears', name: 'Tears for Fears' },
  { id: 'radiohead', name: 'Radiohead' },
  { id: 'arctic-monkeys', name: 'Arctic Monkeys' },
  { id: 'the-strokes', name: 'The Strokes' },
  { id: 'phoenix', name: 'Phoenix' },
  { id: 'justice', name: 'Justice' },
  { id: 'billie-eilish', name: 'Billie Eilish' },
  { id: 'beyonce', name: 'Beyoncé' },
  { id: 'kendrick-lamar', name: 'Kendrick Lamar' },
  { id: 'nirvana', name: 'Nirvana' },
  { id: 'queen', name: 'Queen' },
  { id: 'the-beatles', name: 'The Beatles' },
  { id: 'pink-floyd', name: 'Pink Floyd' },
  { id: 'metallica', name: 'Metallica' },
  { id: 'adele', name: 'Adele' },
  { id: 'drake', name: 'Drake' },
  { id: 'rihanna', name: 'Rihanna' },
  { id: 'lady-gaga', name: 'Lady Gaga' },
  { id: 'coldplay', name: 'Coldplay' },
  { id: 'foo-fighters', name: 'Foo Fighters' },
  { id: 'red-hot-chili-peppers', name: 'Red Hot Chili Peppers' },
  { id: 'oasis', name: 'Oasis' },
  { id: 'rosalia', name: 'Rosalía' },
  { id: 'bad-bunny', name: 'Bad Bunny' },
  { id: 'anitta', name: 'Anitta' },
  { id: 'legiao-urbana', name: 'Legião Urbana' },
  { id: 'titas', name: 'Titãs' },
  { id: 'charlie-brown-jr', name: 'Charlie Brown Jr.' },
  { id: 'sepultura', name: 'Sepultura' },
  { id: 'caetano-veloso', name: 'Caetano Veloso' },
  { id: 'elis-regina', name: 'Elis Regina' },
  { id: 'milton-nascimento', name: 'Milton Nascimento' },
  { id: 'jorge-ben-jor', name: 'Jorge Ben Jor' },
]

const byId = new Map(artists.map((artist) => [artist.id, artist]))

export function slugifyArtist(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function unslugArtist(id: string) {
  return id
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function artistFromToken(token: string): Artist | null {
  const trimmed = token.trim()
  if (!trimmed) return null
  const curated =
    byId.get(trimmed) ?? artists.find((artist) => artist.name.toLowerCase() === trimmed.toLowerCase())
  if (curated) return curated
  const id = slugifyArtist(trimmed)
  if (!id) return null
  const name = trimmed !== id && /[A-Za-zÀ-ÿ]/.test(trimmed) ? trimmed : unslugArtist(id)
  return { id, name }
}

export function artistById(id: string) {
  return artistFromToken(id)
}

export function sanitizeFavoriteIds(raw: unknown) {
  if (!Array.isArray(raw)) return [] as string[]
  const seen = new Set<string>()
  const next: string[] = []
  for (const item of raw) {
    const match = artistFromToken(String(item))
    if (!match || seen.has(match.id)) continue
    seen.add(match.id)
    next.push(byId.has(match.id) ? match.id : match.name)
    if (next.length === 3) break
  }
  return next
}
