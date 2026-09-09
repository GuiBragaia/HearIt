import { deezerChartTracks, deezerPlaylistTracks, type HearTrack } from '@/lib/deezer'
import { normalizeGuess, songCoreTitle, spaceArtists } from '@/lib/game'
import { nonstopTrackKey } from '@/lib/nonstop-heard'

type Lane = 'classic' | 'nineties' | 'oughts' | 'tens' | 'recent' | 'charts'

const PLAYLISTS: Record<Exclude<Lane, 'charts'>, number[]> = {
  classic: [620264073, 1470022445, 8877326262, 867825522, 8512471762, 1413309725],
  nineties: [878989033, 8873744282, 8027597282],
  oughts: [248297032, 1977689462, 8326097522],
  tens: [14917741483, 715215865, 8282573142, 8074581462],
  recent: [13650084141, 5310238702, 5310088722, 3453772742, 5132762464, 1283499335, 12345421311, 12345467671],
}

const CHARTS = [0, 152, 116, 106, 85, 165]
const TAKE: Record<Exclude<Lane, 'charts'>, number> = {
  classic: 4,
  nineties: 3,
  oughts: 3,
  tens: 4,
  recent: 6,
}

const CYCLE: Lane[] = ['recent', 'classic', 'charts', 'tens', 'recent', 'nineties', 'oughts', 'charts']
const SLICE = 60
const OFFSETS = [0, 40, 80, 120, 180, 240, 320, 400]
const QUEUE_SIZE = 48

const BRAZIL_ACTS = [
  'Alok',
  'Anitta',
  'Avine Vinny',
  'Barão Vermelho',
  'Bielzin',
  'Capital Inicial',
  'Caetano Veloso',
  'Cazuza',
  'Charlie Brown Jr.',
  'Chico Buarque',
  'Dennis DJ',
  'Dj Yuri Pedrada',
  'Elis Regina',
  'Emicida',
  'Eric Land',
  'Ferrugem',
  'Gilberto Gil',
  'Gloria Groove',
  'Gusttavo Lima',
  'Henrique e Juliano',
  'Henrique & Juliano',
  'Izael Lopes',
  'Ivete Sangalo',
  'Jão',
  'Jeninho',
  'Jorge Ben Jor',
  'Jorge e Mateus',
  'Jorge & Mateus',
  'Leandro Lehart',
  'Legião Urbana',
  'Luan Santana',
  'Ludmilla',
  'Luísa Sonza',
  'Marília Mendonça',
  'Marisa Monte',
  'Mc J9',
  'MC J9',
  'MC Cabelinho',
  'MC Kevin',
  'MC Leozinho ZS',
  'Milton Nascimento',
  'Natanzinho Lima',
  'Ney Matogrosso',
  'Os Paralamas do Sucesso',
  'Pabllo Vittar',
  'Pedro Sampaio',
  'Pineapple Stormtv',
  'Pitty',
  'Racionais MC\'s',
  'Racionais MCs',
  'Sepultura',
  'Seresta do Rasta',
  'Skank',
  'Titãs',
  'Tribo da Periferia',
  'Vintage Culture',
  'Wesley Safadão',
  'Zezé Di Camargo',
  'Zezé Di Camargo & Luciano',
]

const ALLOWED_MC = new Set(['mc hammer', 'mc lyte', 'mc solaar', 'mc ren', 'mc eiht', 'mc breed'])

function artistKey(name: string) {
  return normalizeGuess(name).replace(/\b e \b/g, ' and ')
}

const BRAZIL_KEYS = new Set(BRAZIL_ACTS.map(artistKey))

function isBrazilAct(name: string) {
  const key = artistKey(name)
  if (BRAZIL_KEYS.has(key)) return true
  if (key.startsWith('mc ') && !ALLOWED_MC.has(key)) return true
  if (/(zinho|zinha)\b/.test(key)) return true
  if (/\b(tribo da|racionais|kondzilla|furacao|pisadinha|sertanejo|pagode|piseiro|forro)\b/.test(key)) return true
  if (/\b(e|and) (mateus|juliano|marrone|sorocaba|belutti|xororo|leonardo|camargo)\b/.test(key)) return true
  return false
}

function looksPortuguese(title: string) {
  return /\b(voce|voces|nao|pra|entao|hoje|amanha|saudade|sozinho|nessa|coracao|acustica|ao vivo|peao|sertanejo|pagode|piseiro|forro|novinha|rebola|quebrada|favela|periferia|me apaixonei|cuida bem|so se for|melhor forma|tatuado|sofrencia|modao|vai embora|baile funk|gostoso|obrigado|menina|garota|beijar|parca|putaria)\b/.test(
    normalizeGuess(title),
  )
}

function isBrazilianTrack(track: HearTrack) {
  return isBrazilAct(track.artist) || looksPortuguese(track.title)
}

function shuffle<T>(list: T[]) {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = next[i]
    const b = next[j]
    if (a === undefined || b === undefined) continue
    next[i] = b
    next[j] = a
  }
  return next
}

function pickSome<T>(list: T[], take: number) {
  return shuffle(list).slice(0, Math.min(take, list.length))
}

function takeNext(
  bucket: HearTrack[],
  usedTrack: Set<string>,
  usedArtist: Set<string> | null,
) {
  const index = bucket.findIndex((track) => {
    if (usedTrack.has(nonstopTrackKey(track))) return false
    if (usedArtist && usedArtist.has(normalizeGuess(track.artist))) return false
    return true
  })
  if (index < 0) return null
  return bucket.splice(index, 1)[0] ?? null
}

async function playlistSlice(id: number) {
  const index = pickSome(OFFSETS, 1)[0] ?? 0
  const tracks = await deezerPlaylistTracks(id, SLICE, index)
  if (tracks.length >= 12 || index === 0) return tracks
  return deezerPlaylistTracks(id, SLICE, 0)
}

function emptyLanes(): Record<Lane, HearTrack[]> {
  return {
    classic: [],
    nineties: [],
    oughts: [],
    tens: [],
    recent: [],
    charts: [],
  }
}

export async function buildNonstopQueue(input: {
  favoriteIds?: string[]
  exclude?: string
  seenIds?: string[]
  seenKeys?: string[]
}) {
  const exclude = normalizeGuess(input.exclude ?? '')
  const seenIds = new Set(input.seenIds ?? [])
  const seenKeys = new Set(input.seenKeys ?? [])
  const playlistSources = (Object.keys(TAKE) as Array<keyof typeof TAKE>).flatMap((lane) => {
    return pickSome(PLAYLISTS[lane], TAKE[lane]).map((id) => ({ lane, id }))
  })
  const chartIds = pickSome(CHARTS, 3)

  const fetched = await Promise.all([
    ...playlistSources.map(async (source) => ({
      lane: source.lane as Lane,
      tracks: await playlistSlice(source.id),
    })),
    ...chartIds.map(async (id) => ({
      lane: 'charts' as const,
      tracks: await deezerChartTracks(id, 50),
    })),
  ])

  const lanes = emptyLanes()
  const catalog = new Set<string>()

  for (const row of fetched) {
    for (const track of row.tracks) {
      const key = nonstopTrackKey(track)
      if (seenIds.has(track.id) || seenKeys.has(key) || catalog.has(key) || catalog.has(track.id)) continue
      if (isBrazilianTrack(track)) continue
      const titleKey = normalizeGuess(songCoreTitle(track.title))
      if (exclude && (titleKey === exclude || normalizeGuess(track.title) === exclude)) continue
      catalog.add(key)
      catalog.add(track.id)
      lanes[row.lane].push(track)
    }
  }

  for (const lane of Object.keys(lanes) as Lane[]) {
    lanes[lane] = shuffle(lanes[lane])
  }

  const pool: HearTrack[] = []
  const usedTrack = new Set<string>()
  const usedArtist = new Set<string>()
  let cursor = Math.floor(Math.random() * CYCLE.length)
  const maxAttempts = QUEUE_SIZE * CYCLE.length

  for (let attempt = 0; attempt < maxAttempts && pool.length < QUEUE_SIZE; attempt += 1) {
    const lane = CYCLE[cursor % CYCLE.length]
    cursor += 1
    const track = lane ? takeNext(lanes[lane], usedTrack, usedArtist) : null
    if (!track) continue
    usedTrack.add(nonstopTrackKey(track))
    usedArtist.add(normalizeGuess(track.artist))
    pool.push(track)
  }

  if (pool.length < QUEUE_SIZE) {
    const leftover = shuffle(Object.values(lanes).flat())
    while (pool.length < QUEUE_SIZE) {
      const track = takeNext(leftover, usedTrack, usedArtist)
      if (!track) break
      usedTrack.add(nonstopTrackKey(track))
      usedArtist.add(normalizeGuess(track.artist))
      pool.push(track)
    }
  }

  if (pool.length < QUEUE_SIZE) {
    const leftover = shuffle(Object.values(lanes).flat())
    while (pool.length < QUEUE_SIZE) {
      const track = takeNext(leftover, usedTrack, null)
      if (!track) break
      usedTrack.add(nonstopTrackKey(track))
      pool.push(track)
    }
  }

  return spaceArtists(pool).slice(0, QUEUE_SIZE)
}

export type { HearTrack }
