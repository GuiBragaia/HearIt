import { cleanDisplayName } from '@/lib/session'

type Meta = Record<string, unknown> | undefined

function metaText(meta: Meta, key: string) {
  const value = meta?.[key]
  if (typeof value === 'string') return value.trim()
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const joined = [record.fullName, record.firstName, record.lastName, record.given_name, record.family_name]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' ')
    return joined
  }
  return ''
}

export const OAUTH_SOURCE = 'hear-it-oauth'

export type OauthMessage = {
  source: typeof OAUTH_SOURCE
  ok: boolean
  code?: string
}

export function markOauthPopup() {
  window.localStorage.setItem(OAUTH_SOURCE, String(Date.now()))
}

export function consumeOauthPopupMark() {
  const raw = window.localStorage.getItem(OAUTH_SOURCE)
  window.localStorage.removeItem(OAUTH_SOURCE)
  const at = raw ? Number(raw) : 0
  return Boolean(at && Date.now() - at < 120_000)
}

export function oauthRedirectTo() {
  return `${window.location.origin}/auth/callback`
}

export function openOauthPopup(provider: 'apple' | 'google') {
  const width = 488
  const height = 720
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2)
  return window.open(
    'about:blank',
    `hear-it-${provider}`,
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  )
}

export function isOauthPopup() {
  try {
    return Boolean(window.opener && window.opener !== window && !window.opener.closed)
  } catch {
    return false
  }
}

export function isOauthMessage(data: unknown): data is OauthMessage {
  return Boolean(data && typeof data === 'object' && (data as { source?: string }).source === OAUTH_SOURCE)
}

export function notifyOauthOpener(ok: boolean, code?: string) {
  const message: OauthMessage = { source: OAUTH_SOURCE, ok, ...(code ? { code } : {}) }
  try {
    window.opener?.postMessage(message, window.location.origin)
  } catch {
    // The opener may already be gone.
  }
  try {
    const channel = new BroadcastChannel(OAUTH_SOURCE)
    channel.postMessage(message)
    channel.close()
  } catch {
    // BroadcastChannel is missing in some embedded browsers.
  }
}

export function oauthHelloKind(user: { created_at?: string; last_sign_in_at?: string }) {
  const created = user.created_at ? Date.parse(user.created_at) : 0
  const last = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : Date.now()
  if (!created) return 'login' as const
  return last - created < 20_000 ? ('join' as const) : ('login' as const)
}

export function displayNameFromOauth(meta: Meta) {
  const raw =
    metaText(meta, 'display_name') ||
    metaText(meta, 'full_name') ||
    metaText(meta, 'name') ||
    metaText(meta, 'given_name')
  return cleanDisplayName(raw).slice(0, 24)
}

export function photoFromOauth(meta: Meta) {
  const raw = metaText(meta, 'avatar_url') || metaText(meta, 'picture')
  return raw.startsWith('https://') ? raw : undefined
}
