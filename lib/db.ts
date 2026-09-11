import { addIsoDays, previousWeekWindow, saoPauloDay, weekWindow } from '@/lib/calendar'
import { dailyKey } from '@/lib/game'
import { emptyStats, personFromRow, statsFromRow, type Person } from '@/lib/people'
import { sanitizeFavoriteIds } from '@/lib/artists'
import { sanitizeSavedTracks, type SavedTrack } from '@/lib/saved-tracks'
import { displayNameFromOauth, photoFromOauth } from '@/lib/oauth'
import {
  initialsFromName,
  type SessionUser,
  usernameFromHandle,
} from '@/lib/session'
import { getSupabase } from '@/lib/supabase'
import type { DailyRun } from '@/lib/daily-run'
import type { LeaderboardRow } from '@/lib/mock'
import { sanitizeShownBadges, unlockedAchievements } from '@/lib/achievements'

const PROFILE_BASE =
  'id, handle, display_name, photo_url, favorites, points, streak, best_streak, songs_guessed, songs_played, perfect_guesses, clutch_guesses, lightning_guesses, sum_clip, last_played_on, created_at'
const PROFILE_COLS = `${PROFILE_BASE}, banner_url, shown_badges`

function missingProfileCol(message?: string) {
  return /banner_url|shown_badges|does not exist|schema cache/i.test(message ?? '')
}

async function profileQuery<T>(
  run: (cols: string) => PromiseLike<{ data: unknown; error: { message?: string } | null }>,
): Promise<{ data: T | null; error: { message?: string } | null }> {
  const full = await run(PROFILE_COLS)
  const result = !full.error || !missingProfileCol(full.error.message) ? full : await run(PROFILE_BASE)
  if (result.error || result.data == null) return { data: null, error: result.error }
  return { data: result.data as T, error: null }
}

type ProfileRow = {
  id: string
  handle: string
  display_name: string
  photo_url: string | null
  banner_url?: string | null
  shown_badges?: string[] | null
  favorites: string[] | null
  saved_tracks?: unknown
  points: number
  streak: number
  best_streak: number
  songs_guessed: number
  songs_played: number
  perfect_guesses: number
  clutch_guesses: number
  lightning_guesses: number
  sum_clip: number
  last_played_on: string | null
  created_at: string
}

type FriendRow = {
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
}

export type FriendLists = {
  friends: string[]
  outgoing: string[]
  incoming: string[]
}

export function sessionFromProfile(
  row: ProfileRow,
  email: string,
  lists: FriendLists,
): SessionUser {
  const handle = `@${row.handle}`
  const name = row.display_name?.trim() ?? ''
  const stats = statsFromRow(row)
  return {
    id: row.id,
    name,
    handle,
    email,
    initials: initialsFromName(name || row.handle),
    createdAt: new Date(row.created_at).getTime(),
    photo: row.photo_url || undefined,
    banner: row.banner_url || undefined,
    shownBadges: sanitizeShownBadges(row.shown_badges, unlockedAchievements(stats)),
    favorites: sanitizeFavoriteIds(row.favorites),
    savedTracks: [],
    friends: lists.friends,
    outgoing: lists.outgoing,
    incoming: lists.incoming,
    named: Boolean(name),
    stats,
  }
}

export async function fetchProfileRow(id: string) {
  const db = getSupabase()
  if (!db) return null
  const { data, error } = await profileQuery<ProfileRow>((cols) =>
    db.from('profiles').select(cols).eq('id', id).maybeSingle(),
  )
  if (error || !data) return null
  return data
}

export async function fetchProfileByHandle(handle: string) {
  const db = getSupabase()
  if (!db) return null
  const token = usernameFromHandle(handle)
  const { data, error } = await profileQuery<ProfileRow>((cols) =>
    db.from('profiles').select(cols).eq('handle', token).maybeSingle(),
  )
  if (error || !data) return null
  return personFromRow(data)
}

export async function fetchPerson(id: string) {
  const row = await fetchProfileRow(id)
  return row ? personFromRow(row) : null
}

export async function fetchPeople(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return [] as Person[]
  const db = getSupabase()
  if (!db) return []
  const { data, error } = await profileQuery<ProfileRow[]>((cols) => db.from('profiles').select(cols).in('id', unique))
  if (error || !data) return []
  const byId = new Map(data.map((row) => [row.id, personFromRow(row)]))
  return unique.map((id) => byId.get(id)).filter(Boolean) as Person[]
}

export async function searchPeople(query: string, exceptId?: string) {
  const db = getSupabase()
  if (!db) return [] as Person[]
  const token = query.replace(/[^a-z0-9_ ]/gi, '').trim().slice(0, 24)
  if (token.length < 2) return []
  const { data, error } = await profileQuery<ProfileRow[]>((cols) => {
    let request = db.from('profiles').select(cols).or(`handle.ilike.%${token}%,display_name.ilike.%${token}%`).limit(12)
    if (exceptId) request = request.neq('id', exceptId)
    return request
  })
  if (error || !data) return []
  return data.map(personFromRow)
}

export async function loadFriendLists(userId: string): Promise<FriendLists> {
  const db = getSupabase()
  if (!db) return { friends: [], outgoing: [], incoming: [] }
  const { data, error } = await db
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  if (error || !data) return { friends: [], outgoing: [], incoming: [] }

  const friends: string[] = []
  const outgoing: string[] = []
  const incoming: string[] = []
  for (const row of data as FriendRow[]) {
    if (row.status === 'accepted') {
      friends.push(row.requester_id === userId ? row.addressee_id : row.requester_id)
    } else if (row.requester_id === userId) {
      outgoing.push(row.addressee_id)
    } else {
      incoming.push(row.requester_id)
    }
  }
  return { friends, outgoing, incoming }
}

export async function loadSessionUser(userId: string, email: string) {
  const [row, lists, savedTracks] = await Promise.all([
    fetchProfileRow(userId),
    loadFriendLists(userId),
    loadSavedTracks(userId),
  ])
  if (!row) return null
  return { ...sessionFromProfile(row, email, lists), savedTracks }
}

export async function waitForSessionUser(userId: string, email: string) {
  for (let i = 0; i < 12; i += 1) {
    const profile = await loadSessionUser(userId, email)
    if (profile) return profile
    await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1)))
  }
  return null
}

export async function applyOauthProfile(userId: string, meta: Record<string, unknown> | undefined) {
  const row = await fetchProfileRow(userId)
  if (!row) return null
  const fromOauth = displayNameFromOauth(meta)
  const stored = row.display_name?.trim() ?? ''
  const name = !stored || stored.startsWith('{') ? fromOauth || stored : stored
  const photo = row.photo_url || photoFromOauth(meta) || null
  if (name === (row.display_name ?? '') && photo === row.photo_url) return row
  return patchProfile(userId, { display_name: name, photo_url: photo })
}

export async function requestFriend(userId: string, targetId: string) {
  const db = getSupabase()
  if (!db || userId === targetId) return loadFriendLists(userId)
  const { data: reverse } = await db
    .from('friendships')
    .select('id, status')
    .eq('requester_id', targetId)
    .eq('addressee_id', userId)
    .maybeSingle()
  if (reverse?.status === 'pending') {
    await db.from('friendships').update({ status: 'accepted' }).eq('id', reverse.id)
    return loadFriendLists(userId)
  }
  if (reverse?.status === 'accepted') return loadFriendLists(userId)
  await db.from('friendships').insert({ requester_id: userId, addressee_id: targetId, status: 'pending' })
  return loadFriendLists(userId)
}

export async function acceptFriend(userId: string, fromId: string) {
  const db = getSupabase()
  if (!db) return loadFriendLists(userId)
  await db
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', fromId)
    .eq('addressee_id', userId)
    .eq('status', 'pending')
  return loadFriendLists(userId)
}

export async function dropFriendship(userId: string, otherId: string) {
  const db = getSupabase()
  if (!db) return loadFriendLists(userId)
  await db.from('friendships').delete().or(
    `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`,
  )
  return loadFriendLists(userId)
}

export async function patchProfile(
  userId: string,
  patch: {
    display_name?: string
    favorites?: string[]
    photo_url?: string | null
    banner_url?: string | null
    shown_badges?: string[]
  },
) {
  const db = getSupabase()
  if (!db) return null
  const { data, error } = await profileQuery<ProfileRow>((cols) =>
    db.from('profiles').update(patch).eq('id', userId).select(cols).maybeSingle(),
  )
  if (error || !data) return null
  return data
}

function asSavedRows(tracks: SavedTrack[]) {
  return tracks.map((track) => ({
    track_id: track.id,
    title: track.title,
    artist: track.artist,
    artwork_url: track.artworkUrl,
    saved_at: new Date(track.savedAt || Date.now()).toISOString(),
  }))
}

function fromSavedRows(rows: Array<{ track_id?: string; title?: string; artist?: string; artwork_url?: string | null; saved_at?: string }>) {
  return sanitizeSavedTracks(
    rows.map((row) => ({
      id: row.track_id,
      title: row.title,
      artist: row.artist,
      artworkUrl: row.artwork_url ?? null,
      savedAt: row.saved_at ? Date.parse(row.saved_at) : 0,
    })),
  )
}

export async function loadSavedTracks(userId: string) {
  const db = getSupabase()
  if (!db) return []
  const table = await db
    .from('song_saves')
    .select('track_id, title, artist, artwork_url, saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
  if (!table.error) return fromSavedRows(table.data ?? [])
  const { data } = await db.from('profiles').select('saved_tracks').eq('id', userId).maybeSingle()
  return sanitizeSavedTracks((data as { saved_tracks?: unknown } | null)?.saved_tracks)
}

export async function persistSavedTracks(userId: string, tracks: SavedTrack[]) {
  const db = getSupabase()
  if (!db) return false
  const clean = sanitizeSavedTracks(tracks)
  const wiped = await db.from('song_saves').delete().eq('user_id', userId)
  if (!wiped.error) {
    if (!clean.length) return true
    const { error } = await db.from('song_saves').insert(
      asSavedRows(clean).map((row) => ({ ...row, user_id: userId })),
    )
    return !error
  }
  const { error } = await db.from('profiles').update({ saved_tracks: clean }).eq('id', userId)
  return !error
}

export async function uploadAvatar(userId: string, dataUrl: string) {
  const db = getSupabase()
  if (!db) return null
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${userId}/avatar.jpg`
  const { error } = await db.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  })
  if (error) return null
  const { data } = db.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function uploadBanner(userId: string, dataUrl: string) {
  const db = getSupabase()
  if (!db) return null
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${userId}/banner.jpg`
  const { error } = await db.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  })
  if (error) return null
  const { data } = db.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function deleteOwnAccount() {
  const db = getSupabase()
  if (!db) return false
  const { error } = await db.rpc('delete_own_account')
  if (error) return false
  await db.auth.signOut()
  return true
}

export async function loadTodayRun(userId: string, songId: string): Promise<DailyRun | null> {
  const db = getSupabase()
  if (!db) return null
  const day = dailyKey()
  const { data, error } = await db
    .from('daily_runs')
    .select('song_id, won, score, duration, level, day')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle()
  if (error || !data) return null
  if (data.song_id !== songId) return null
  return {
    key: data.day as string,
    songId: data.song_id as string,
    won: Boolean(data.won),
    score: Number(data.score),
    duration: Number(data.duration),
    level: Number(data.level),
  }
}

export async function loadDayRun(userId: string): Promise<DailyRun | null> {
  const db = getSupabase()
  if (!db) return null
  const day = dailyKey()
  const { data, error } = await db
    .from('daily_runs')
    .select('song_id, won, score, duration, level, day')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle()
  if (error || !data) return null
  return {
    key: data.day as string,
    songId: data.song_id as string,
    won: Boolean(data.won),
    score: Number(data.score),
    duration: Number(data.duration),
    level: Number(data.level),
  }
}

export async function submitTodayRun(run: DailyRun) {
  const db = getSupabase()
  if (!db) return null
  const { data, error } = await db.rpc('submit_daily_run', {
    p_song_id: run.songId,
    p_won: run.won,
    p_score: run.score,
    p_duration: run.duration,
    p_level: run.level,
    p_day: run.key,
  })
  if (error) return null
  return data
}

export async function resetTodayRunRemote() {
  const db = getSupabase()
  if (!db) return
  await db.rpc('reset_today_run', { p_day: dailyKey() })
}

export type RecentRun = {
  day: string
  songId: string
  won: boolean
  score: number
  duration: number
  level: number
}

export async function loadRecentRuns(userId: string, limit = 5): Promise<RecentRun[]> {
  const db = getSupabase()
  if (!db) return []
  const { data, error } = await db
    .from('daily_runs')
    .select('day, song_id, won, score, duration, level')
    .eq('user_id', userId)
    .order('day', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map((row) => ({
    day: row.day as string,
    songId: row.song_id as string,
    won: Boolean(row.won),
    score: Number(row.score) || 0,
    duration: Number(row.duration) || 0,
    level: Number(row.level) || 0,
  }))
}

export async function countPlayersToday() {
  const db = getSupabase()
  if (!db) return 0
  const { count, error } = await db
    .from('daily_runs')
    .select('id', { count: 'exact', head: true })
    .eq('day', dailyKey())
  if (error) return 0
  return count ?? 0
}

export async function recapToday(score: number) {
  const db = getSupabase()
  const players = await countPlayersToday()
  if (!db || !players) return { rank: 1, beat: 0, players: 0 }
  const { count, error } = await db
    .from('daily_runs')
    .select('id', { count: 'exact', head: true })
    .eq('day', dailyKey())
    .gt('score', score)
  if (error) return { rank: 1, beat: 0, players }
  const ahead = count ?? 0
  const rank = ahead + 1
  const beat = players <= 1 ? 0 : Math.round(((players - rank) / (players - 1)) * 100)
  return { rank, beat, players }
}

function rangeBounds(range: 'week' | 'month' | 'all') {
  if (range === 'all') return { from: null as string | null, to: null as string | null }
  if (range === 'week') {
    const week = weekWindow()
    return { from: week.start, to: week.end }
  }
  const today = saoPauloDay()
  return { from: addIsoDays(today, -29), to: addIsoDays(today, 1) }
}

const BOARD_SIZE = 80

export type LeaderboardBoard = {
  rows: LeaderboardRow[]
  you: LeaderboardRow | null
  total: number
}

function rowFromPerson(
  person: Person,
  score: number,
  time: number,
  streak: number,
  board: 'global' | 'friends',
  youId: string | undefined,
  rank: number,
): LeaderboardRow {
  return {
    id: person.id,
    name: person.name || person.handle,
    handle: person.handle,
    photo: person.photo,
    initials: person.initials,
    score,
    time,
    streak,
    rank,
    you: person.id === youId,
    region: board,
  }
}

function packBoard(ranked: LeaderboardRow[]): LeaderboardBoard {
  return {
    rows: ranked.slice(0, BOARD_SIZE),
    you: ranked.find((row) => row.you) ?? null,
    total: ranked.length,
  }
}

export type WeekChampions = {
  rows: LeaderboardRow[]
  week: { start: string; end: string }
}

type RunAgg = { user_id: string; score: number; duration: number; won: boolean }

async function boardFromRuns(
  runRows: RunAgg[],
  board: 'global' | 'friends',
  youId?: string,
): Promise<LeaderboardBoard> {
  const empty: LeaderboardBoard = { rows: [], you: null, total: 0 }
  const totals = new Map<string, { score: number; time: number; wins: number }>()
  for (const row of runRows) {
    const cur = totals.get(row.user_id) ?? { score: 0, time: 0, wins: 0 }
    cur.score += Number(row.score)
    if (row.won) {
      cur.time += Number(row.duration)
      cur.wins += 1
    }
    totals.set(row.user_id, cur)
  }
  const ids = [...totals.keys()]
  if (!ids.length) return empty
  const people = await fetchPeople(ids)
  const byId = new Map(people.map((person) => [person.id, person]))
  const ranked = ids
    .map((id) => {
      const person = byId.get(id)
      const tot = totals.get(id)
      if (!person || !tot) return null
      return rowFromPerson(
        person,
        tot.score,
        tot.wins ? Math.round((tot.time / tot.wins) * 100) / 100 : 0,
        person.stats.streak,
        board,
        youId,
        0,
      )
    })
    .filter(Boolean)
    .sort((a, b) => (b as LeaderboardRow).score - (a as LeaderboardRow).score) as LeaderboardRow[]

  ranked.forEach((row, index) => {
    row.rank = index + 1
  })

  return packBoard(ranked)
}

async function loadRunsInWindow(
  from: string,
  to: string,
  board: 'global' | 'friends',
  youId?: string,
  friendIds: string[] = [],
): Promise<LeaderboardBoard> {
  const empty: LeaderboardBoard = { rows: [], you: null, total: 0 }
  const db = getSupabase()
  if (!db) return empty

  let userIds: string[] | null = null
  if (board === 'friends') {
    userIds = youId ? [...friendIds, youId] : [...friendIds]
    if (!userIds.length) return empty
  }

  let runs = db.from('daily_runs').select('user_id, score, duration, won').gte('day', from).lt('day', to)
  if (userIds) runs = runs.in('user_id', userIds)
  const { data: runRows, error: runError } = await runs
  if (runError || !runRows) return empty
  return boardFromRuns(runRows as RunAgg[], board, youId)
}

export async function loadWeekChampions(youId?: string): Promise<WeekChampions> {
  const week = previousWeekWindow()
  const board = await loadRunsInWindow(week.start, week.end, 'global', youId)
  return { rows: board.rows.slice(0, 3), week }
}

export async function loadLeaderboard(
  range: 'week' | 'month' | 'all',
  board: 'global' | 'friends',
  youId?: string,
  friendIds: string[] = [],
): Promise<LeaderboardBoard> {
  const empty: LeaderboardBoard = { rows: [], you: null, total: 0 }
  const db = getSupabase()
  if (!db) return empty

  const bounds = rangeBounds(range)
  let userIds: string[] | null = null
  if (board === 'friends') {
    userIds = youId ? [...friendIds, youId] : [...friendIds]
    if (!userIds.length) return empty
  }

  if (range === 'all') {
    const { data, error } = await profileQuery<ProfileRow[]>((cols) => {
      let query = db.from('profiles').select(cols).gt('points', 0).order('points', { ascending: false })
      if (userIds) query = query.in('id', userIds)
      else query = query.limit(BOARD_SIZE)
      return query
    })
    if (error || !data) return empty
    const rows = data.map((row, index) => {
      const person = personFromRow(row)
      const stats = statsFromRow(row)
      return rowFromPerson(person, stats.points, stats.averageTime, stats.streak, board, youId, index + 1)
    })

    let you = rows.find((row) => row.you) ?? null
    if (youId && !you && !userIds) {
      const mine = await fetchProfileRow(youId)
      if (mine) {
        const person = personFromRow(mine)
        const stats = statsFromRow(mine)
        const { count } = await db
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('points', stats.points)
        you = rowFromPerson(person, stats.points, stats.averageTime, stats.streak, board, youId, (count ?? 0) + 1)
      }
    }

    let total = rows.length
    if (!userIds) {
      const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).gt('points', 0)
      total = count ?? rows.length
    }

    return { rows, you, total }
  }

  if (!bounds.from || !bounds.to) return empty
  return loadRunsInWindow(bounds.from, bounds.to, board, youId, friendIds)
}

export { emptyStats }
