import { deezerPlaylistTracks, type HearTrack } from '@/lib/deezer'
import { normalizeGuess, songCoreTitle, spaceArtists } from '@/lib/game'

const CHART_PLAYLISTS = [
  3155776842, // Top Worldwide
  1313621735, // Top USA
  1111142221, // Top UK
  1109890291, // Top France
  1111143121, // Top Germany
  1652248171, // Top Canada
  1313616925, // Top Australia
  1116190041, // Top Spain
  1116187241, // Top Italy
  1266971851, // Top Netherlands
  1313620305, // Top Sweden
  13562522521, // Top Women Worldwide
]

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

function trackKey(track: HearTrack) {
  return `${normalizeGuess(songCoreTitle(track.title))}:${normalizeGuess(track.artist)}`
}

export async function buildNonstopQueue(input: {
  favoriteIds?: string[]
  exclude?: string
  seenIds?: string[]
}) {
  const exclude = normalizeGuess(input.exclude ?? '')
  const seenIds = new Set(input.seenIds ?? [])
  const playlists = shuffle(CHART_PLAYLISTS).slice(0, 6)
  const buckets = await Promise.all(playlists.map((id) => deezerPlaylistTracks(id)))

  const usedTrack = new Set<string>()
  const usedArtist = new Set<string>()
  const pool: HearTrack[] = []

  for (const track of shuffle(buckets.flat())) {
    const key = trackKey(track)
    const artist = normalizeGuess(track.artist)
    const titleKey = normalizeGuess(songCoreTitle(track.title))
    if (usedTrack.has(key) || usedArtist.has(artist) || seenIds.has(track.id)) continue
    if (isBrazilianTrack(track)) continue
    if (exclude && (titleKey === exclude || normalizeGuess(track.title) === exclude)) continue
    usedTrack.add(key)
    usedArtist.add(artist)
    pool.push(track)
  }

  return spaceArtists(shuffle(pool)).slice(0, 36)
}

export type { HearTrack }
