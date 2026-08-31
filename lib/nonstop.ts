import { deezerPlaylistTracks, type HearTrack } from '@/lib/deezer'
import { normalizeGuess, songCoreTitle, spaceArtists } from '@/lib/game'

type Lane = 'classic' | 'nineties' | 'oughts' | 'tens' | 'recent'

const PLAYLISTS: Record<Lane, number[]> = {
  classic: [620264073, 1470022445, 8877326262, 867825522, 8512471762, 1413309725],
  nineties: [878989033, 8873744282, 8027597282],
  oughts: [248297032, 1977689462, 8326097522],
  tens: [14917741483, 715215865, 8282573142, 8074581462],
  recent: [13650084141, 5310238702, 5310088722, 3453772742, 5132762464, 1283499335, 12345421311, 12345467671],
}

const CYCLE: Lane[] = ['recent', 'classic', 'tens', 'recent', 'nineties', 'oughts']
const HEAD = 22

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

function trackKey(track: HearTrack) {
  return `${normalizeGuess(songCoreTitle(track.title))}:${normalizeGuess(track.artist)}`
}

function takeNext(
  bucket: HearTrack[],
  usedTrack: Set<string>,
  usedArtist: Set<string>,
) {
  const index = bucket.findIndex((track) => {
    return !usedTrack.has(trackKey(track)) && !usedArtist.has(normalizeGuess(track.artist))
  })
  if (index < 0) return null
  return bucket.splice(index, 1)[0] ?? null
}

export async function buildNonstopQueue(input: {
  favoriteIds?: string[]
  exclude?: string
  seenIds?: string[]
}) {
  const exclude = normalizeGuess(input.exclude ?? '')
  const seenIds = new Set(input.seenIds ?? [])
  const sources = (Object.keys(PLAYLISTS) as Lane[]).flatMap((lane) => {
    const take = lane === 'recent' ? 3 : 2
    return pickSome(PLAYLISTS[lane], take).map((id) => ({ lane, id }))
  })

  const fetched = await Promise.all(
    sources.map(async (source) => ({
      lane: source.lane,
      tracks: await deezerPlaylistTracks(source.id, HEAD, 0),
    })),
  )

  const lanes: Record<Lane, HearTrack[]> = {
    classic: [],
    nineties: [],
    oughts: [],
    tens: [],
    recent: [],
  }

  for (const row of fetched) {
    for (const track of row.tracks) {
      if (seenIds.has(track.id) || isBrazilianTrack(track)) continue
      const titleKey = normalizeGuess(songCoreTitle(track.title))
      if (exclude && (titleKey === exclude || normalizeGuess(track.title) === exclude)) continue
      lanes[row.lane].push(track)
    }
  }

  for (const lane of Object.keys(lanes) as Lane[]) {
    lanes[lane] = shuffle(lanes[lane])
  }

  const pool: HearTrack[] = []
  const usedTrack = new Set<string>()
  const usedArtist = new Set<string>()
  let cursor = 0
  let idle = 0

  while (pool.length < 36 && idle < CYCLE.length * 4) {
    const lane = CYCLE[cursor % CYCLE.length]
    cursor += 1
    const track = lane ? takeNext(lanes[lane], usedTrack, usedArtist) : null
    if (!track) {
      idle += 1
      continue
    }
    idle = 0
    usedTrack.add(trackKey(track))
    usedArtist.add(normalizeGuess(track.artist))
    pool.push(track)
  }

  if (pool.length < 36) {
    const leftover = shuffle(Object.values(lanes).flat())
    while (pool.length < 36) {
      const track = takeNext(leftover, usedTrack, usedArtist)
      if (!track) break
      usedTrack.add(trackKey(track))
      usedArtist.add(normalizeGuess(track.artist))
      pool.push(track)
    }
  }

  return spaceArtists(pool).slice(0, 36)
}

export type { HearTrack }
