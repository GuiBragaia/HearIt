import { sanitizeFavoriteIds } from '@/lib/artists'
import { isOffensiveName } from '@/lib/profanity'
import type { SavedTrack } from '@/lib/saved-tracks'

export type SessionUser = {
  id: string
  name: string
  handle: string
  email: string
  initials: string
  createdAt: number
  photo?: string
  favorites: string[]
  savedTracks: SavedTrack[]
  friends: string[]
  outgoing: string[]
  incoming: string[]
  named?: boolean
  stats: {
    streak: number
    bestStreak: number
    songsGuessed: number
    accuracy: number
    averageTime: number
    perfectGuesses: number
    points: number
    clutchGuesses: number
    lightningGuesses: number
  }
}

function cleanName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function handleFromUsername(username: string) {
  const token = username
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]+/g, '')
    .slice(0, 16)
  return `@${token || 'player'}`
}

export function usernameFromHandle(handle: string) {
  return handle.replace(/^@/, '').toLowerCase()
}

const DEV_HANDLES = new Set(['gui'])

export function isGameDev(handle?: string | null) {
  if (!handle) return false
  return DEV_HANDLES.has(usernameFromHandle(handle))
}

const STREAMER_LINKS: Record<string, string> = {
  sr_kasai: 'https://www.twitch.tv/sr_kasai',
}

export function streamerUrl(handle?: string | null) {
  if (!handle) return null
  return STREAMER_LINKS[usernameFromHandle(handle)] ?? null
}

export function initialsFromName(name: string) {
  const parts = cleanName(name).split(' ').filter(Boolean)
  if (parts.length === 0) return 'HI'
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function profileTitle(user: { name: string; handle: string }) {
  return cleanName(user.name) || user.handle
}

export function hasDisplayName(user: { name: string; handle: string }) {
  return Boolean(cleanName(user.name))
}

export function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_]{2,16}$/.test(value.trim())
}

export function displayNameIssue(value: string) {
  if (cleanName(value).length > 24) return 'display' as const
  if (isOffensiveName(value)) return 'offensive' as const
  return null
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function cleanDisplayName(value: string) {
  return isOffensiveName(value) ? '' : cleanName(value)
}

export { sanitizeFavoriteIds }
