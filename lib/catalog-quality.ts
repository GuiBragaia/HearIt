import { normalizeGuess, songCoreTitle } from '@/lib/game'

const JUNK_ARTIST =
  /\b(tribute|karaoke|lullaby|nursery|baby sleep|twinkle twinkle|relaxing piano|spa music|yoga|sound alike|originally performed|various artists|kids bop|sleep baby|rockabye|piano dreamers|vitamin string|midnite string|string tribute|pickin on|twinkle twinkle little)\b/

const JUNK_RECORDING =
  /\b(karaoke|tribute|lullaby|nursery|baby sleep|twinkle twinkle|originally performed|in the style of|piano cover|guitar cover|ukulele cover|violin cover|drum cover|bootleg|mashup|rework|nightcore|sped up|slowed|reverb|8d audio|8 bit|tiktok|instrumental|ao vivo|en vivo|unplugged|acustico|acoustic|radio edit|single edit|video edit|club edit|club mix|extended mix|vip mix|dj mix|\w*mix|mixed|live version|live at|reimagined|alternate version|alternative version|alternate lyrics|other version|bit version|freestyle version|soul version|bossa version|tabata|reprise|demo\b|session|take \d|set dj|trava chip|piseiro|tema de)\b|[(\[]\s*live\s*[)\]]|\s-\s+live\b/

export function titlesMatch(expected: string, got: string) {
  const want = normalizeGuess(songCoreTitle(expected))
  const have = normalizeGuess(songCoreTitle(got))
  return Boolean(want && have && want === have)
}

export function artistsMatch(expected: string, got: string) {
  const want = normalizeGuess(expected)
  const have = normalizeGuess(got)
  if (!want || !have) return false
  if (want === have) return true
  if (have.startsWith(`${want} `) || have.includes(` ${want} `) || have.endsWith(` ${want}`)) return true
  if (want.length >= 8 && have.includes(want)) return true
  return false
}

export function isJunkArtist(name: string) {
  const value = normalizeGuess(name)
  if (!value || value === 'remix') return true
  return JUNK_ARTIST.test(value)
}

export function isJunkRecording(input: { title?: string; artist?: string; album?: string }) {
  if (isJunkArtist(input.artist ?? '')) return true
  const blob = normalizeGuess(`${input.title ?? ''} ${input.album ?? ''}`)
  return JUNK_RECORDING.test(blob)
}

export function isStudioTrack(input: { title?: string; artist?: string; album?: string }) {
  return !isJunkRecording(input)
}

const LIGHT_WORDS = new Set([
  'a',
  'an',
  'and',
  'da',
  'de',
  'do',
  'el',
  'feat',
  'ft',
  'in',
  'la',
  'las',
  'los',
  'of',
  'on',
  'or',
  'the',
  'to',
  'vs',
])

function allowedDistance(len: number) {
  if (len <= 3) return 0
  if (len <= 5) return 1
  if (len <= 9) return 2
  return 3
}

function editDistance(a: string, b: string) {
  if (a === b) return 0
  const al = a.length
  const bl = b.length
  if (!al) return bl
  if (!bl) return al
  if (Math.abs(al - bl) > 4) return 99
  const prev = new Array<number>(bl + 1)
  const next = new Array<number>(bl + 1)
  for (let j = 0; j <= bl; j += 1) prev[j] = j
  for (let i = 1; i <= al; i += 1) {
    next[0] = i
    const code = a.charCodeAt(i - 1)
    for (let j = 1; j <= bl; j += 1) {
      const cost = code === b.charCodeAt(j - 1) ? 0 : 1
      next[j] = Math.min((next[j - 1] ?? 99) + 1, (prev[j] ?? 99) + 1, (prev[j - 1] ?? 99) + cost)
    }
    for (let j = 0; j <= bl; j += 1) prev[j] = next[j] ?? 99
  }
  return prev[bl] ?? 99
}

function tokenHits(token: string, words: string[], blob: string) {
  if (blob.includes(token)) return true
  const allow = allowedDistance(token.length)
  for (const word of words) {
    if (word.startsWith(token)) return true
    if (token.length >= 3 && word.length >= 3 && token.startsWith(word)) return true
    if (allow > 0 && Math.abs(word.length - token.length) <= allow && editDistance(word, token) <= allow) {
      return true
    }
  }
  return false
}

export function fuzzyFits(query: string, haystack: string) {
  const needle = normalizeGuess(query)
  const blob = normalizeGuess(haystack)
  if (!needle) return true
  if (!blob) return false
  if (blob.includes(needle)) return true
  const words = blob.split(' ').filter(Boolean)
  if (needle.length >= 3 && words.some((word) => word.startsWith(needle))) return true
  const raw = needle.split(' ').filter((token) => token.length >= 2)
  const tokens = raw.filter((token) => !LIGHT_WORDS.has(token))
  const usable = tokens.length ? tokens : raw
  if (!usable.length) return false
  return usable.every((token) => tokenHits(token, words, blob))
}

function hitBlob(hit: { title: string; artist: string }) {
  const title = normalizeGuess(hit.title)
  const core = normalizeGuess(songCoreTitle(hit.title))
  const artist = normalizeGuess(hit.artist)
  return { title, core, artist, blob: `${core} ${title} ${artist}` }
}

export function guessFitsQuery(query: string, hit: { title: string; artist: string }) {
  const needle = normalizeGuess(query)
  if (needle.length < 2) return true
  return suggestionFitsQuery(query, hit)
}

/** Autocomplete: 2 letters match artists; from 3, titles too, including light typos. */
export function suggestionFitsQuery(query: string, hit: { title: string; artist: string }) {
  const needle = normalizeGuess(query)
  if (needle.length < 2) return false
  const { title, core, artist, blob } = hitBlob(hit)
  if (fuzzyFits(needle, artist)) return true
  if (needle.length < 3) return false
  return fuzzyFits(needle, core) || fuzzyFits(needle, title) || fuzzyFits(needle, blob)
}
