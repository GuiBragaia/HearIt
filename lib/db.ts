import { dailyKey } from '@/lib/game'
import { emptyStats, personFromRow, statsFromRow, type Person } from '@/lib/people'
import { sanitizeFavoriteIds } from '@/lib/artists'
import { displayNameFromOauth, photoFromOauth } from '@/lib/oauth'
import {
  initialsFromName,
  type SessionUser,
  usernameFromHandle,
} from '@/lib/session'
import { getSupabase } from '@/lib/supabase'
import type { DailyRun } from '@/lib/daily-run'
import type { LeaderboardRow } from '@/lib/mock'

const PROFILE_COLS =
  'id, handle, display_name, photo_url, favorites, points, streak, best_streak, songs_guessed, songs_played, perfect_guesses, clutch_guesses, lightning_guesses, sum_clip, last_played_on, created_at'

type ProfileRow = {
  id: string
  handle: string
  display_name: string
  photo_url: string | null
  favorites: string[] | null
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
  return {
    id: row.id,
    name,
    handle,
    email,
    initials: initialsFromName(name || row.handle),
    createdAt: new Date(row.created_at).getTime(),
    photo: row.photo_url || undefined,
    favorites: sanitizeFavoriteIds(row.favorites),
    friends: lists.friends,
    outgoing: lists.outgoing,
    incoming: lists.incoming,
    named: Boolean(name),
    stats: statsFromRow(row),
  }
}

export async function fetchProfileRow(id: string) {
  const db = getSupabase()
  if (!db) return null
  const { data, error } = await db.from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as ProfileRow
}

export async function fetchProfileByHandle(handle: string) {
  const db = getSupabase()
  if (!db) return null
  const token = usernameFromHandle(handle)
  const { data, error } = await db.from('profiles').select(PROFILE_COLS).eq('handle', token).maybeSingle()
  if (error || !data) return null
  return personFromRow(data as ProfileRow)
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
  const { data, error } = await db.from('profiles').select(PROFILE_COLS).in('id', unique)
  if (error || !data) return []
  const rows = data as ProfileRow[]
  const byId = new Map(rows.map((row) => [row.id, personFromRow(row)]))
  return unique.map((id) => byId.get(id)).filter(Boolean) as Person[]
}

export async function searchPeople(query: string, exceptId?: string) {
  const db = getSupabase()
  if (!db) return [] as Person[]
  const token = query.replace(/[^a-z0-9_ ]/gi, '').trim().slice(0, 24)
  if (token.length < 2) return []
  let request = db.from('profiles').select(PROFILE_COLS).or(`handle.ilike.%${token}%,display_name.ilike.%${token}%`).limit(12)
  if (exceptId) request = request.neq('id', exceptId)
  const { data, error } = await request
  if (error || !data) return []
  return (data as ProfileRow[]).map(personFromRow)
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
  const [row, lists] = await Promise.all([fetchProfileRow(userId), loadFriendLists(userId)])
  if (!row) return null
  return sessionFromProfile(row, email, lists)
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
  patch: { display_name?: string; favorites?: string[]; photo_url?: string | null },
) {
  const db = getSupabase()
  if (!db) return null
  const { data, error } = await db.from('profiles').update(patch).eq('id', userId).select(PROFILE_COLS).maybeSingle()
  if (error || !data) return null
  return data as ProfileRow
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

export async function submitTodayRun(run: DailyRun) {
  const db = getSupabase()
  if (!db) return null
  const { data, error } = await db.rpc('submit_daily_run', {
    p_song_id: run.songId,
    p_won: run.won,
    p_score: run.score,
    p_duration: run.duration,
    p_level: run.level,
  })
  if (error) return null
  return data
}

export async function resetTodayRunRemote() {
  const db = getSupabase()
  if (!db) return
  await db.rpc('reset_today_run')
}

export async function loadRecentRuns(userId: string, limit = 8) {
  const db = getSupabase()
  if (!db) return [] as Array<{ day: string; songId: string; won: boolean }>
  const { data, error } = await db
    .from('daily_runs')
    .select('day, song_id, won')
    .eq('user_id', userId)
    .order('day', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map((row) => ({
    day: row.day as string,
    songId: row.song_id as string,
    won: Boolean(row.won),
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

function rangeFrom(range: 'week' | 'month' | 'all') {
  const now = new Date()
  if (range === 'all') return null
  const days = range === 'week' ? 7 : 30
  const from = new Date(now)
  from.setDate(now.getDate() - days + 1)
  return dailyKey(from)
}

export async function loadLeaderboard(
  range: 'week' | 'month' | 'all',
  board: 'global' | 'friends',
  youId?: string,
  friendIds: string[] = [],
): Promise<LeaderboardRow[]> {
  const db = getSupabase()
  if (!db) return []

  const from = rangeFrom(range)
  let userIds: string[] | null = null
  if (board === 'friends') {
    userIds = youId ? [...friendIds, youId] : [...friendIds]
    if (!userIds.length) return []
  }

  if (range === 'all') {
    let query = db.from('profiles').select(PROFILE_COLS).order('points', { ascending: false }).limit(80)
    if (userIds) query = query.in('id', userIds)
    const { data, error } = await query
    if (error || !data) return []
    return (data as ProfileRow[])
      .filter((row) => row.points > 0 || row.id === youId)
      .map((row) => {
        const person = personFromRow(row)
        const stats = statsFromRow(row)
        return {
          id: row.id,
          name: person.name || person.handle,
          handle: person.handle,
          photo: person.photo,
          initials: person.initials,
          score: stats.points,
          time: stats.averageTime,
          streak: stats.streak,
          you: row.id === youId,
          region: board,
        } satisfies LeaderboardRow
      })
  }

  let runs = db.from('daily_runs').select('user_id, score, duration, won').gte('day', from)
  if (userIds) runs = runs.in('user_id', userIds)
  const { data: runRows, error: runError } = await runs
  if (runError || !runRows) return []

  const totals = new Map<string, { score: number; time: number; wins: number }>()
  for (const row of runRows as Array<{ user_id: string; score: number; duration: number; won: boolean }>) {
    const cur = totals.get(row.user_id) ?? { score: 0, time: 0, wins: 0 }
    cur.score += Number(row.score)
    if (row.won) {
      cur.time += Number(row.duration)
      cur.wins += 1
    }
    totals.set(row.user_id, cur)
  }
  const ids = [...totals.keys()]
  if (!ids.length) return []
  const people = await fetchPeople(ids)
  const byId = new Map(people.map((person) => [person.id, person]))
  return ids
    .map((id) => {
      const person = byId.get(id)
      const tot = totals.get(id)
      if (!person || !tot) return null
      return {
        id,
        name: person.name || person.handle,
        handle: person.handle,
        photo: person.photo,
        initials: person.initials,
        score: tot.score,
        time: tot.wins ? Math.round((tot.time / tot.wins) * 100) / 100 : 0,
        streak: person.stats.streak,
        you: id === youId,
        region: board,
      } satisfies LeaderboardRow
    })
    .filter(Boolean)
    .sort((a, b) => (b as LeaderboardRow).score - (a as LeaderboardRow).score) as LeaderboardRow[]
}

export { emptyStats }
