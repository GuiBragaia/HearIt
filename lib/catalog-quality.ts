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

function wordsStartWith(value: string, needle: string) {
  return value.split(' ').some((word) => word.startsWith(needle))
}

export function guessFitsQuery(query: string, hit: { title: string; artist: string }) {
  const needle = normalizeGuess(query)
  if (needle.length < 2) return true
  const title = normalizeGuess(hit.title)
  const core = normalizeGuess(songCoreTitle(hit.title))
  const artist = normalizeGuess(hit.artist)
  if (title.includes(needle) || core.includes(needle) || artist.includes(needle)) return true
  if (core.length >= 3 && artist.length >= 3 && needle.includes(core) && needle.includes(artist)) return true
  const forward = `${core} ${artist}`
  const reverse = `${artist} ${core}`
  if (forward.includes(needle) || reverse.includes(needle)) return true
  const tokens = needle.split(' ').filter((token) => token.length >= 2)
  if (tokens.length < 2) return false
  const blob = `${core} ${title} ${artist}`
  return tokens.every((token) => blob.includes(token))
}

/** Autocomplete only: short queries match artists, not title prefixes. */
export function suggestionFitsQuery(query: string, hit: { title: string; artist: string }) {
  const needle = normalizeGuess(query)
  if (needle.length < 2) return false
  const title = normalizeGuess(hit.title)
  const core = normalizeGuess(songCoreTitle(hit.title))
  const artist = normalizeGuess(hit.artist)

  if (artist.startsWith(needle) || wordsStartWith(artist, needle)) return true

  if (needle.length < 4) return false
  if (core.startsWith(needle) || title.startsWith(needle)) return true
  if (wordsStartWith(core, needle) || wordsStartWith(title, needle)) return true
  if (title.includes(needle) || core.includes(needle)) return true
  if (core.length >= 3 && artist.length >= 3 && needle.includes(core) && needle.includes(artist)) return true
  return `${core} ${artist}`.includes(needle) || `${artist} ${core}`.includes(needle)
}
